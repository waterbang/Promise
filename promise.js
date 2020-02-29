const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';
console.log('-----🎉----')
// promise处理函数
const resolvePromise = (promise2, x, resolve, reject) => {
  // 处理x 的类型来决定是调用resolve或者reject
  if (promise2 === x) {
    return reject(new TypeError(`Chaining cycle detected for promise #<Promise>`));
  }
  // 判断x 是不是一个普通值
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    // 可能是promise 如果不是promise then
    let called;
    try {
      let then = x.then; // 看一看有没有then方法
      if (typeof then === 'function') {
        // 是promise
        then.call(x, (y) => {
          if (called) return;
          called = true;
          resolvePromise(promise2, y, resolve, reject);
        }, (r) => {
          if (called) return;
          called = true;
          resolvePromise(promise2, r, resolve, reject);
        });
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e); // 没有then直接抛出异常就好了。
    }
  } else {
    resolve(x);
  }
}
class Promise {
  constructor(executor) {
    // 创建promise executor 会立即执行
    this.value = undefined;
    this.reason = undefined;
    this.status = PENDING;
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];

    let resolve = value => {
      if (value instanceof Promise) {
        return value.then(resolve, reject);
      }
      if (this.status === PENDING) {
        this.value = value;
        this.status = FULFILLED;
        this.onResolvedCallbacks.forEach(fn => fn()); //发布
      }
    }
    let reject = reason => {
      if (this.status === PENDING) {
        this.reason = reason;
        this.status = REJECTED;
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    }
    // 这里可能发生异常
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val;
    onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };
    // then方法调用后应该返回一个新的promise
    let promise2 = new Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        })
      }
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        })
      }
      if (this.status === PENDING) {
        this.onResolvedCallbacks.push(() => {// 订阅
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          })
        });
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          })
        });
      }
    });
    return promise2;
  }
  catch(errCallback) {
    return this.then(null, errCallback);
  }
  static resolve(value) {
    return new Promise((resovle, reject) => {
      resovle(value)
    })
  }
  static reject(reason) {
    return new Promise((resovle, reject) => {
      reject(value);
    })
  }
  finally(callback) {
    let P = this.constructor;
    return this.then(
      value  => P.resolve(callback()).then(() => value),
      reason => P.resolve(callback()).then(() => { throw reason })
    );
  }
}


module.exports = Promise;

// Promise.deferred = function () {
//   let dfd = {};
//   dfd.promise = new Promise((resolve, reject) => {
//     dfd.resolve = resolve;
//     dfd.reject = reject;
//   })
//   return dfd;
// }


// 先全局安装 在进行测试 promises-aplus-tests 文件名