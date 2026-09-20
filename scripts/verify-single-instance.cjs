const assert = require('node:assert/strict')
const { enableSingleInstance } = require('../electron/single-instance.cjs')

const primaryHandlers = new Map()
let primaryQuitCalls = 0
let focusCalls = 0
const primaryApp = {
  requestSingleInstanceLock: () => true,
  on: (event, handler) => primaryHandlers.set(event, handler),
  quit: () => { primaryQuitCalls += 1 },
}

assert.equal(enableSingleInstance(primaryApp, () => { focusCalls += 1 }), true, '主进程获得锁后应继续启动')
assert.equal(primaryQuitCalls, 0, '主进程获得锁后不能退出')
assert.equal(typeof primaryHandlers.get('second-instance'), 'function', '主进程必须监听第二实例启动')
primaryHandlers.get('second-instance')()
assert.equal(focusCalls, 1, '第二实例启动时必须唤醒既有窗口')

let rejectedQuitCalls = 0
let rejectedRegistrations = 0
const rejectedApp = {
  requestSingleInstanceLock: () => false,
  on: () => { rejectedRegistrations += 1 },
  quit: () => { rejectedQuitCalls += 1 },
}

assert.equal(enableSingleInstance(rejectedApp, () => {}), false, '没有获得锁的第二进程必须停止启动')
assert.equal(rejectedQuitCalls, 1, '第二进程必须立即退出')
assert.equal(rejectedRegistrations, 0, '第二进程不应注册第二实例处理器')

console.log('桌面单实例测试通过：主进程会接管第二次启动，第二进程不会进入工作台初始化。')
