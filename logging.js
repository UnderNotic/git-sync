const log = console.log;
const error = console.error;

console.log = function () {
    arguments[0] = `[${new Date().toISOString()}] ${arguments[0]}`;
    log.apply(console, arguments);
};

console.error = function () {
    arguments[0] = `[${new Date().toISOString()}] ${arguments[0]}`;
    error.apply(console, arguments);
};