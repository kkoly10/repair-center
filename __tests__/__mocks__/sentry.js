module.exports = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
  withScope: jest.fn((cb) => cb({ setTag: jest.fn(), setExtra: jest.fn() })),
}
