/*
 * @Description: 入口文件
 * @Author: hai-27
 * @Date: 2020-03-14 20:14:45
 * @LastEditors: hai-27
 * @LastEditTime: 2020-03-15 13:33:13
 */
const Koa = require('koa');
const KoaStatic = require('koa-static');
const KoaBody = require('koa-body');
const Session = require('koa-session');

let { Port, staticDir, uploadDir } = require('./config');

let app = new Koa();

// 异常处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.log(error);
    ctx.body = {
      code: '500',
      msg: '服务器未知错误'
    }
  }
});

// 为静态资源请求重写url
app.use(async (ctx, next) => {
  if (ctx.url.startsWith('/public')) {
    ctx.url = ctx.url.replace('/public', '');
  }
  await next();
});
// 使用koa-static处理静态资源
app.use(KoaStatic(staticDir));

// session
const CONFIG = require('./middleware/session');
app.keys = ['session app keys'];
app.use(Session(CONFIG, app));

// 判断是否登录
const isLogin = require('./middleware/isLogin');
app.use(isLogin);

app.use(async (ctx, next) => {
  ctx.state.user = ctx.session.user;
  await next();
});

// 处理请求体数据
app.use(KoaBody({
  multipart: true,
  // parsedMethods默认是['POST', 'PUT', 'PATCH']
  parsedMethods: ['POST', 'PUT', 'PATCH', 'GET', 'HEAD', 'DELETE'],
  formidable: {
    uploadDir: uploadDir, // 设置文件上传目录
    keepExtensions: true, // 保持文件的后缀
    maxFieldsSize: 2 * 1024 * 1024, // 文件上传大小限制
    onFileBegin: (name, file) => { // 文件上传前的设置
      // console.log(`name: ${name}`);
      // console.log(file);
    }
  }
}));

// 使用路由中间件
const Routers = require('./routers');
app.use(Routers.routes()).use(Routers.allowedMethods());

// 监听服务器启动端口
app.listen(Port, () => {
  console.log(`服务器启动在${ Port }端口`);
});