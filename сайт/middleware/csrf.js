const ALLOWED_DEV_HOSTS = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

function getHostname(hostHeader) {
  if (!hostHeader) return '';
  return hostHeader.split(':')[0].toLowerCase();
}

function csrfProtection(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;
  const xForwardedHost = req.headers['x-forwarded-host'];

  // Разрешаем запросы без origin и referer
  const hasOrigin = origin && origin !== 'null' && origin !== 'undefined';
  const hasReferer = referer && referer !== 'null' && referer !== 'undefined';
  if (!hasOrigin && !hasReferer) {
    return next();
  }

  // Разрешаем localhost и 127.0.0.1
  const hostname = getHostname(host);
  const forwardedHostname = getHostname(xForwardedHost);
  if (ALLOWED_DEV_HOSTS.includes(hostname) || ALLOWED_DEV_HOSTS.includes(forwardedHostname) || ALLOWED_DEV_HOSTS.includes(req.hostname)) {
    return next();
  }

  // Собираем все разрешённые хосты
  const allowedHostnames = new Set();
  if (hostname) allowedHostnames.add(hostname);
  if (forwardedHostname) allowedHostnames.add(forwardedHostname);
  const expressHostname = req.hostname;
  if (expressHostname) allowedHostnames.add(expressHostname);

  // Проверяем Origin
  if (hasOrigin) {
    try {
      const originHostname = new URL(origin).hostname.toLowerCase();
      if (allowedHostnames.has(originHostname)) {
        return next();
      }
    } catch (e) {}
  }

  // Проверяем Referer
  if (hasReferer) {
    try {
      const refererHostname = new URL(referer).hostname.toLowerCase();
      if (allowedHostnames.has(refererHostname)) {
        return next();
      }
    } catch (e) {}
  }

  // Если origin и referer совпадают — разрешаем
  if (hasOrigin && hasReferer) {
    try {
      const originHostname = new URL(origin).hostname.toLowerCase();
      const refererHostname = new URL(referer).hostname.toLowerCase();
      if (originHostname === refererHostname) {
        return next();
      }
    } catch (e) {}
  }

  return res.status(403).json({ error: 'Защита от CSRF: недопустимый источник запроса' });
}

module.exports = { csrfProtection };
