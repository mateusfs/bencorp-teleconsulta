const path = require('node:path');
const Module = require('node:module');

const distRoot = path.resolve(__dirname, '..', 'dist');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveWithPathAlias(
  request,
  parent,
  isMain,
  options,
) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    const rewritten = path.join(distRoot, request.slice(2));
    return originalResolveFilename.call(this, rewritten, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
