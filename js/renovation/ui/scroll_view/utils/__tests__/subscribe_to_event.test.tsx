import { DisposeEffectReturn } from '../../../../utils/effect_return';
import resizeObserverSingleton from '../../../../../core/resize_observer';
import { getWindow, setWindow } from '../../../../../core/utils/window';

import { subscribeToResize } from '../subscribe_to_resize';

jest.mock('../../../../../core/resize_observer', () => ({
  ...jest.requireActual('../../../../../core/resize_observer'),
  observe: jest.fn(),
  unobserve: jest.fn(),
}));

describe('subscribeToResize', () => {
  afterEach(() => { jest.clearAllMocks(); });

  it('should not initialize resizeObservable on element if element is not defined', () => {
    const observeHandler = jest.fn();
    resizeObserverSingleton.observe = observeHandler;

    subscribeToResize(null, () => {});

    expect(observeHandler).toBeCalledTimes(0);
  });

  it('should not initialize resizeObservable on element if window is not defined', () => {
    const originalWindow = getWindow();

    try {
      setWindow({}, false);

      const observeHandler = jest.fn();
      const resizeHandler = jest.fn();
      resizeObserverSingleton.observe = observeHandler;

      const element = {
        clientWidth: 10,
        clientHeight: 15,
      } as HTMLDivElement;

      subscribeToResize(element, resizeHandler);

      expect(observeHandler).toBeCalledTimes(0);
    } finally {
      setWindow(originalWindow, true);
    }
  });

  it('resize effect should return undefined value if window is not defined', () => {
    const originalWindow = getWindow();

    try {
      setWindow({}, false);

      const handler = jest.fn();
      const unobserveHandler = jest.fn();
      resizeObserverSingleton.unobserve = unobserveHandler;

      const element = {
        clientWidth: 10,
        clientHeight: 15,
      } as HTMLDivElement;

      const unsubscribeFn = subscribeToResize(element, handler);

      expect(unsubscribeFn).toEqual(undefined);
      expect(unobserveHandler).toBeCalledTimes(0);
    } finally {
      setWindow(originalWindow, true);
    }
  });

  it('should observe element changing, hasWindow: true', () => {
    const observeHandler = jest.fn();
    const resizeHandler = jest.fn();
    resizeObserverSingleton.observe = observeHandler;

    const element = {
      clientWidth: 10,
      clientHeight: 15,
    } as HTMLDivElement;

    subscribeToResize(element, resizeHandler);

    expect(observeHandler).toBeCalledTimes(1);
    expect(observeHandler.mock.calls[0][0]).toEqual(element);

    const target = {
      clientWidth: 20,
      clientHeight: 30,
    };
    const entry = { target };
    observeHandler.mock.calls[0][1](entry);
    expect(resizeHandler).toBeCalledTimes(1);
    expect(resizeHandler).toBeCalledWith(target);
  });

  it('should unobserve element changing on unsubsribe from effect, hasWindow: true', () => {
    const handler = jest.fn();
    const unobserveHandler = jest.fn();
    resizeObserverSingleton.unobserve = unobserveHandler;

    const element = {
      clientWidth: 10,
      clientHeight: 15,
    } as HTMLDivElement;

    const unsubscribeFn = subscribeToResize(element, handler);

    (unsubscribeFn as DisposeEffectReturn)();

    expect(unobserveHandler).toBeCalledTimes(1);
    expect(unobserveHandler).toBeCalledWith(element);
  });
});
