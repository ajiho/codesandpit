export default {
  debounce(func, wait = 500) {
    let timeout

    return function () {
      const context = this
      const args = arguments

      clearTimeout(timeout)
      timeout = setTimeout(function () {
        func.apply(context, args)
      }, wait)
    }
  },

  onResize(element, callback, firstExec = false) {
    const resizeObserver = new ResizeObserver((entries) => {
      // 处理大小变化的回调函数
      entries.forEach((entry) => {
        // entry.target 是发生大小变化的元素 entry.contentRect 包含元素的新大小信息

        if (!entry.target.firstResize && firstExec === false) {
          //优化:第一次不执行
          entry.target.firstResize = true
          return
        }

        callback.call(element, entry.contentRect)
      })
    })
    resizeObserver.observe(element)
  },

  extend() {
    //用于判断一个对象是否是纯粹的 JavaScript 对象（即不是 DOM 对象、函数、数组等）。具体作用是检查对象是否通过对象字面量或 new Object() 创建，且其原型链上只包含标准的 Object 原型
    const isPlainObject = (obj) => {
      if (typeof obj !== 'object' || obj === null || obj instanceof Array) {
        return false
      }

      const prototype = Object.getPrototypeOf(obj)
      return prototype === Object.prototype || prototype === null
    }

    let options,
      name,
      src,
      copy,
      copyIsArray,
      clone,
      target = arguments[0] || {}, //第一个参数
      i = 1,
      length = arguments.length,
      deep = false

    // 处理深度复制情况
    if (typeof target === 'boolean') {
      deep = target

      // 跳过布尔值和目标
      target = arguments[i] || {}
      i++
    }

    // 当目标是字符串或其他东西时处理大小写（可能在深度复制中）
    if (typeof target !== 'object' && typeof target !== 'function') {
      target = {}
    }

    // 如果只传递一个参数，则扩展jQuery本身
    if (i === length) {
      target = this
      i--
    }

    for (; i < length; i++) {
      // 仅处理非null/未定义的值
      if ((options = arguments[i]) != null) {
        // 延伸基础对象
        for (name in options) {
          copy = options[name]

          // 防止Object.prototype污染
          // 防止无休止的循环
          if (name === '__proto__' || target === copy) {
            continue
          }

          // 如果我们正在合并普通对象或数组，则重复出现
          if (
            deep &&
            copy &&
            (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))
          ) {
            src = target[name]

            // 确保源值的类型正确
            if (copyIsArray && !Array.isArray(src)) {
              clone = []
            } else if (!copyIsArray && !isPlainObject(src)) {
              clone = {}
            } else {
              clone = src
            }
            copyIsArray = false

            // 从不移动原始对象，而是克隆它们
            target[name] = this.extend(deep, clone, copy)

            // 不要引入未定义的值
            // } else if (copy !== undefined) {
          } else {
            target[name] = copy
          }
        }
      }
    }

    // 返回修改后的对象
    return target
  },

  sprintf(_str, ...args) {
    let flag = true
    let i = 0

    const str = _str.replace(/%s/g, () => {
      const arg = args[i++]

      if (typeof arg === 'undefined') {
        flag = false
        return ''
      }
      return arg
    })

    return flag ? str : ''
  },

  setProperty(htmlString, propertyName, value) {
    const tempElement = document.createElement('div')
    tempElement.innerHTML = htmlString
    const firstElementChild = tempElement.firstElementChild
    firstElementChild.style.setProperty(propertyName, value)
    return firstElementChild.outerHTML
  },
}
