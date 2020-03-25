/* @flow */

import config from '../config'
import { noop } from 'shared/util'

export let warn = noop
export let tip = noop
export let generateComponentTrace = (noop: any) // work around flow check
export let formatComponentName = (noop: any)
//如果是在开发环境 或者 在测试环境
if (process.env.NODE_ENV !== 'production') {
  //如果 有 window.console, 这里用typeof判断, 是因为如果用 if(window.console)
  //在没有console的浏览器中, window对象会增加一个属性 console, 虽然它的值是undefined, 不太确定
  const hasConsole = typeof console !== 'undefined'
  //这个正则就是把连接符转换成的驼峰写法, 并且第一个字符大写  ^|[-_]　的意思是 字符串的开头, 或者 -_ 后面的一个字符
  // str = 'ms-border'  经过 classify(str) =>  MsBorder
  //这里 ?: 是希望在它的这个括号不用捕获了, 也就是 (?:^|[-_])这个整体, 正则不会把它当成是一个子项, 所以 $1就是(\w)
  //?: 非常常见, 是为了提高正则的性能
  const classifyRE = /(?:^|[-_])(\w)/g
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '')
  //classifyRE = /(^|[-_])(\w)/g 如果写成这样  str.replace(classifyRE,function(a,b,c){ console.log( 'a:'+a +' b:' +b+ '  c:' +c ) })
  //会输出 a:a  b:  c:a       a:-p   b:-  c:p
  //可以看到 b第一次是开头, 开头的位置, 没有值, 所以第一次b是空
  //第二次是 -
  warn = (msg, vm) => {
    const trace = vm ? generateComponentTrace(vm) : ''

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace)
      //如果配置的console.silent, 就不会打印错误日志
    } else if (hasConsole && (!config.silent)) {
      console.error(`[Vue warn]: ${msg}${trace}`)
    }
  }
  //这个函数功能和上面一样, 但是上面的程度比较严重, 用了console.error, 这里是 console.warn
  tip = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      console.warn(`[Vue tip]: ${msg}` + (
        vm ? generateComponentTrace(vm) : ''
      ))
    }
  }

  formatComponentName = (vm, includeFile) => {
    //看来如果是根组件, 它会有一个属性.$root 指向它自己
    if (vm.$root === vm) {
      return '<Root>'
    }
    //这三元写的, 可读性太差, 源码这么写是为了节省代码, 简单的来说就是先看option有没自定义options,如果没有就用vm.options, 这个options应该是vue自己配置的一个随机数
    const options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm
    let name = options.name || options._componentTag
    const file = options.__file
    if (!name && file) {
      // abc/dd.vue 获取其中的dd , 也就是组件的名称
      const match = file.match(/([^/\\]+)\.vue$/)
      //全匹配时 dd.vue, 第一个子项是 dd
      name = match && match[1]
    }

    return (
      // 这里使用了es6的语法 ${变量名}, 最终返回驼峰
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      //提示文件路径出错
      (file && includeFile !== false ? ` at ${file}` : '')
    )
  }

  const repeat = (str, n) => {
    let res = ''
    while (n) {
      if (n % 2 === 1) res += str
      if (n > 1) str += str
      n >>= 1
    }
    return res
  }
// 就是返回那段 (found in component <...> )
  generateComponentTrace = vm => {
    if (vm._isVue && vm.$parent) {
      const tree = []
      let currentRecursiveSequence = 0
      while (vm) {
        if (tree.length > 0) {
          const last = tree[tree.length - 1]
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++
            vm = vm.$parent
            continue
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence]
            currentRecursiveSequence = 0
          }
        }
        tree.push(vm)
        vm = vm.$parent
      }
      return '\n\nfound in\n\n' + tree
        .map((vm, i) => `${
          i === 0 ? '---> ' : repeat(' ', 5 + i * 2)
        }${
          Array.isArray(vm)
            ? `${formatComponentName(vm[0])}... (${vm[1]} recursive calls)`
            : formatComponentName(vm)
        }`)
        .join('\n')
    } else {
      return `\n\n(found in ${formatComponentName(vm)})`
    }
  }
}
