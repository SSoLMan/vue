
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Vue = factory());
}(this, (function () { 
    'use strict';




 const _lifecycleHooks= [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed'
  ]
 
 let componentId = 1
 class Vue {
    constructor(option={}){
        this.option = option //配置项
        this.init()
    }
    init(){
        this.create()   //创建组件（创建期间要进行 生命周期和数据初始化）
        this.mount() //添加组件，生成dom （这个周期，需要确定el绑定的元素，解析template或者jsx语法，生成虚拟dom，）
    }
    isComponent(){
         var component = Vue.components[tagName]
         if(component){
             component.init()
             return true
         }
    }
    domRender(preVNode,vNode){
        // 对比 preVNode  vNode
        
    } 
    // 创建dom元素的方法
    createElement(tagName,option,cont){ 

        if(this.isComponent(tagName)){
           return
        }
        var domEl = document.createElement(tagName)
        domEl.isNode = true
        if(Object.prototype.toString.call(option)==="[object Object]"){
          option.on&&Object.keys(option.on).forEach(ele=>{
            domEl["on"+ele] = option.on[ele]
          });
          option.directives&& Object.keys(option.directives).forEach(key=>{
            if(this.directives[key]){
              this.directives[key](ele,option.directives[key])
            }else{
              console.warn(`directive ${key} is not defined`)
            }
          })
        }else{
          cont = cont||option
        }
        var child = null
        if(Object.prototype.toString.call(cont)==="[object Array]"){
            cont.forEach(e=>{
                if(e.isNode){
                    domEl.appendChild(e)
                }else{
                    var oSpan = document.createElement("span")
                    console.log(e)
                    oSpan.innerHTML = typeof e ==="string"?e:JSON.stringify(e)
                    domEl.appendChild(oSpan)
                }
            })
        }else{
            domEl.innerHTML = cont;
        }
        return domEl
    }
    // 初始化声明周期函数
    initLifecycle(){
        let option = this.option
        console.log("初始钩子 init lifecycle hooks")
        _lifecycleHooks.forEach(hookName=>{
            this[hookName] = option[hookName] || function(){}
        })
        //组装 render函数
        this.render = ()=>{
            if(this.this.el){
                this.el =document.querySelector(this.option.el)
                this.el.appendChild(option.render.call(this,this.createElement))
            }else{
                return option.render.call(this,this.createElement)
            }
            
        }
    }
    initData(){
        console.log("初始化 方法和响应数据")
        //初始化响应数据（重要）
        let option = this.option
        this._data = {}
        Object.keys(option.data).forEach(ele=>{
            proxy(this,"_data",ele)  // proxy data on instance

            //拷贝 option的data到  组件实例（vue实现的方法更复杂）
            defineReactive(this._data,ele,option.data[ele])//(obj,key,val)
        });

        // 拷贝 option的 方法到 组件实例
        Object.keys(option.methods).forEach(ele=>{
            this[ele] = option.methods[ele]
        })

        //计算属性
        let computedWatcher = this.option.computed||{}
        Object.keys(computedWatcher).map(key=>{
           Dep.target = ()=>{this[key]=computedWatcher[key].call(this);}
           defineReactive(this,key,computedWatcher[key].call(this))
           Dep.target = null
        })
       
          //watch  深监听
        let watchs = this.option.watch||{}
        Object.keys(watchs).map(key=>{
            new Watch(this,key,watchs,true)//默认深度监听
        })
    }
    create(){//create
        this.directives = Vue.directives
        this.id = componentId++;
        this.initLifecycle() //&event &initRender
        this.beforeCreate() //callHook 
        this.initData() //initInjections & INITState &initProvide
        this.created() //callHook
    }
    mount(){//第一次render 
       
        this.beforeMount()
        Dep.target = new Watcher(this,this.update)
        this.render()
        Dep.target = null
    }
    
    update(){
        //更新时调用
        this.beforeUpdate()
        this.render()
        this.updated()
    }
    destroy(){
        //销毁时调用
        this.beforeDestroy()
        this.el.innerHTML = "" //destroy
        this.destroyed()
    }
 
}

let pending = false //队列执行的等待状态
let queue = []//异步队列
// 改写了Watcher 用来实现异步队列
class Watcher {
    constructor(vm,update){
        this.vm = vm
        this.update = update.bind(vm)
    }
    run(){
        //队列添加未添加过的watcher
        let has = false;
        queue.forEach(ele=>{
            if(ele.vm.id==this.vm.id){ //通过识别组件id避免重复添加同一个update到异步队列
                has =true
            }
        })
        if(!has){
            queue.push(this)
        }
        
        //通过异步去执行队列
        if(!pending){ 
            //如果异步队列不处于等待状态（空闲状态）就异步执行 队列回调
            pending = true
            if(typeof Promise !== 'undefined'){
                let p = Promise.resolve();
                p.then(()=>{
                    queue.forEach(ele=>{
                        ele.update()
                    })
                    pending = false
                })
            }else{
                setTimeout(()=>{
                    queue.forEach(ele=>{
                        ele.update()
                    })
                    pending = false
                },0)
            }
        }
    }
}

//监听     watch
class Watch{
    constructor(vm,key,watchs,deep){
        console.log(key,watchs[key])
        Dep.target = watchs[key].bind(vm)
        if(deep){
            this.deep(vm[key])
        }else{
            var tmp = vm[key]
            tmp = null
        }
        Dep.target = null
    }
    deep (obj){
        //深监听需要递归每一个属性，自动get 添加dep 
        if(typeof obj === "object") {
            Object.keys(obj).map(key=>{
                this.deep(obj[key])
            })
        }
    }
}
//依赖收集
class Dep{
    constructor(){
        this.watchList = []
    }
    add(cb){
        this.watchList.push(cb)
    }
    notify(){
        this.watchList.forEach(e=>{
           
            if(typeof e =="function"){
                e()
            }else{
                e.run()
            }
        })
    }
}   
//代理
const proxy = (obj,sourceKey,key)=>{
    Object.defineProperty(obj,key,{
        configurable:true,
        enumerable:true,
        get(){
            return obj[sourceKey][key]
        },
        set(val){
            obj[sourceKey][key] = val
        }
    })
}

//响应数据设置的方法
const defineReactive=(obj,key,val)=>{
    //递归，属性如果是对象 也 添加数据监听
    var dep = new Dep()
    if(typeof val==="object"&&val!=null){
        Object.keys(val).map(ele=>{
            defineReactive(val,ele,val[ele])     
        })
    }
    Object.defineProperty(obj,key,{
        get:function(){
            if(Dep.target){
                dep.add(Dep.target)
            }
            return val
        },
        set:function(newVal){
            //设置数据的时候，如果修改前后的值没有发生变化就返回 
            if(newVal==val){
                return 
            }
            val = newVal;
            dep.notify()
           
        }
    })

}

//   static 
Vue.directives = {}
Vue.directive = (dName,factory)=>{
    Do.directives[dName]=factory.bind(this)
}



class Component extends Vue {
    constructor(name,options){
        if(typeof options ==="object"){
            super(options)
        }else if(typeof options ==="function"){
            var p =  options()
            if(!p.then){
                console.warn("options must be a object or promise factory")
                return
            }
            p.then((option)=>{
                 super(option)
            })
        }else{
            console.warn("options must be a object or promise factory")
            return 
        }
        this.name = name
    }
    mount(){//第一次render 
       
        this.beforeMount()
        Dep.target = new Watcher(this,this.update)
        this.vNode = this.render()
        Dep.target = null
    }
    
    update(){
        //更新时调用
        this.beforeUpdate()
        this.vNode = this.render()
        this.updated()
    }
}
Vue.components = {}
Vue.component = function(name,options){
    Vue.components[name] = new Component(name,options)
}














    return Vue
})));