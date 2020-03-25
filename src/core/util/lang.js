/* @flow */

/**
 * unicode letters used for parsing html tags, component names and property paths.
 * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
 * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
 */
export const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/

/**
 * Check if a string starts with $ or _
 *    ascii unicode 的区别
 　　
 charcodeAt是一个字符的 unicode编码, 但是像 0x24 (代表的是 $ )  0x5f (代表的是 _ ) 因为是字符, 先存着ascii编码中, 所以用ascii转换

 $ _ 作为保留字, 这里判断输入的字符是否是vue可能使用的关键字, 比如 $set _bind 等等
 */
export function isReserved (str: string): boolean {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.
 * 这里简单的定义一个对象, 定义它的值 和 是否能在for...in循环中遍历出来或在Object.keys中列举出来。
 */
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true //注意要设置成true, 否则后面就不能设置value了
  })
}

/**
 * Parse simple path.
 *    解析简单的路径, 比如 o.corp.$1, 是合法的, 不在正则 bailRE中
 而 o.corp.names[0]是不合法的, 会被直接return, 因为对象才能被defineProperty, 数组是不能监听的.
 　　
 　　使用
 　　var path = parsePath('o.corp.$1');
 　　var obj = { o:{ corp: { $1: 'haha' } } }

 path( obj )  ==> 'haha'

 这里没有直接用 eval或者 new Function去解析路径, 应该是考虑到用这两个会有性能的损耗, 另外eval在一些浏览器会提示作用域变成全局的, 比较的危险
 另外, new Function eval 还可以转换 js语句的字符串, 所以会有一些安全问题, xss注入等
 */
const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`)
export function parsePath (path: string): any {
  if (bailRE.test(path)) {
    return
  }
  //得到一个数组 ['o', 'corp', '$1' ]
  const segments = path.split('.')
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      // obj = obj['o'] => obj=obj['o']['corp'] = > obj=obj['o']['corp']['$1'], 这就是不断改变obj的值, 使obj指向自己属性的过程
      // 最后返回 $1的值 'haha'
      obj = obj[segments[i]]
    }
    return obj
  }
}
