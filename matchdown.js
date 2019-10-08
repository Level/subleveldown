module.exports = function matchdown (db, type) {
  // Skip layers that we handle ourselves
  if (type === 'levelup') return false
  if (type === 'encoding-down') return false
  if (type === 'deferred-leveldown') return false

  return true
}
