function enableSingleInstance(app, onSecondInstance) {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return false
  }
  app.on('second-instance', () => onSecondInstance())
  return true
}

module.exports = { enableSingleInstance }
