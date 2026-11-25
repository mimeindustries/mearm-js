const test = require('node:test');
const assert = require('assert');
const EventEmitter = require('events');
const led = require('../lib/StatusLED.js');

const BOOKWORM_PI4 = 'gpiochip0 [pinctrl-bcm2711] (58 lines)\ngpiochip1 [raspberrypi-exp-gpio] (8 lines)\n';
const PI5 = 'gpiochip0 [gpio-brcmstb@107d508500] (32 lines)\ngpiochip4 [pinctrl-rp1] (54 lines)\n';

test('finds the header GPIO chip on each Pi generation', () => {
  assert.strictEqual(led.findHeaderChip(BOOKWORM_PI4), 'gpiochip0');
  assert.strictEqual(led.findHeaderChip(PI5), 'gpiochip4');
  assert.strictEqual(led.findHeaderChip('gpiochip0 [pinctrl-bcm2835] (54 lines)'), 'gpiochip0');
  assert.strictEqual(led.findHeaderChip('gpiochip0 [some-other-board] (10 lines)'), null);
});

test('builds gpioset arguments for libgpiod v1 and v2', () => {
  const leds = {red: 1, green: 0, blue: 1};
  assert.strictEqual(led.parseMajorVersion('gpioset (libgpiod) v1.6.3\nCopyright'), 1);
  assert.strictEqual(led.parseMajorVersion('gpioset (libgpiod) v2.2.1'), 2);
  assert.deepStrictEqual(led.gpiosetArgs(1, 'gpiochip0', leds), ['--mode=signal', 'gpiochip0', '7=1', '8=1', '11=0']);
  assert.deepStrictEqual(led.gpiosetArgs(2, 'gpiochip4', leds), ['-c', 'gpiochip4', '7=1', '8=1', '11=0']);
});

test('LED colours follow network state', () => {
  assert.deepStrictEqual(led.ledsForNetwork({eth0: {ip: '10.0.0.2'}, wlan0: {}}), {red: 0, green: 0, blue: 1});
  assert.deepStrictEqual(led.ledsForNetwork({eth0: {}, wlan0: {ip: '10.0.0.3'}}), {red: 0, green: 1, blue: 0});
  assert.deepStrictEqual(led.ledsForNetwork({eth0: {}, wlan0: {}}), {red: 1, green: 0, blue: 0});
});

test('holds one gpioset process and only respawns when the colour changes', () => {
  const spawned = [];
  const s = new led.StatusLed({
    execFileSync: (cmd) => cmd === 'gpioset' ? 'gpioset (libgpiod) v2.2.1\n' : PI5,
    spawn: (cmd, args) => {
      const child = new EventEmitter();
      child.killed = false;
      child.kill = () => { child.killed = true; };
      spawned.push({cmd, args, child});
      return child;
    },
    networkInterfaces: () => ({wlan0: [{family: 'IPv4', internal: false, address: '192.168.1.5', mac: 'aa'}]})
  });
  s.detect();
  assert.strictEqual(s.chip, 'gpiochip4');
  s.checkStatus();
  s.checkStatus();
  assert.strictEqual(spawned.length, 1);
  assert.deepStrictEqual(spawned[0].args, ['-c', 'gpiochip4', '7=0', '8=0', '11=1']);
  s.setLEDs({red: 1, green: 0, blue: 0});
  assert.strictEqual(spawned.length, 2);
  assert.strictEqual(spawned[0].child.killed, true);
  s.stop();
  assert.strictEqual(spawned[1].child.killed, true);
});

test('detect fails clearly when not on a Pi', () => {
  const s = new led.StatusLed({execFileSync: (cmd) => cmd === 'gpioset' ? 'gpioset (libgpiod) v1.6.3' : ''});
  assert.throws(() => s.detect(), /no Raspberry Pi GPIO chip/);
});
