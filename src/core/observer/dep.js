/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 *  一个订阅模式 可以有多个指令去订阅他
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first 避免改动影响到原来的数组
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
// 一个全局唯一的, 因为只能有一个watcher 依赖的对象的值 被计算, 在任何时间
Dep.target = null
/*
　　利用这个中间变量, 缓存已有的target, 在 pushTarget 函数, 使用传入的target 代替 Dep.target; 然后使用 Dep.target
   最后使用 popTarget 还原 ; 主要是为了Observe中的get方法, 判断当前是否有watcher(Dep.target), 如果有就在dep增加这个属性的依赖, Dep.target.depend( dep1 )

   比如 methods 的每一个方法可以是 一个 watcher, 这个wactcher可能会依赖多个 data里面的属性
 */
const targetStack = []
//放入 dep的 订阅者
export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}
//得到一个 dep的 订阅者
export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
