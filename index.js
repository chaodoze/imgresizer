const Koa = require('koa')
const axios = require('axios')
const sharp = require('sharp')
const memoize = require('memoizee')
const querystring = require('querystring')

const parseUrl = (url)=> {
  console.log('url', url)
  const [path, query] = url.split('?', 2)
  const queryObj = querystring.parse(query)
  return {url:`${process.env.BASE_URL || 'http://www.gamersunite.com'}${path}`, resizeWidth:queryObj.w}
}

const fetchImage = async (requestUrl)=>{
  const {url, resizeWidth} = parseUrl(requestUrl)
  const response = await axios({method:'get', url, responseType:'arraybuffer'})
  console.log('resizeWidth',parseInt(resizeWidth,10), resizeWidth)
  const buffer = await sharp(response.data).resize(parseInt(resizeWidth,10)).jpeg().toBuffer()
  return buffer
}

const mFetchImage = memoize(fetchImage, 1, {primitive:true, promise: true, max:1000, maxAge:1000*60*60*24})

const app = new Koa()
app.use(async ctx => {
  const {request, response} = ctx
  if (request.url == "/") {
    console.log('hello world')
    ctx.body = "hello world"
    return
  }
  if (request.url.endsWith('.ico')) {
    ctx.throw(404)
    return;
  }
  try {
    const buffer = await mFetchImage(request.url)
    ctx.set( 'Content-Type','image/jpeg')
    ctx.set('Cache-Control', 'public, max-age=2592000')
    ctx.body = buffer
  }
  catch(e) {
    console.error(e)
    ctx.throw(e.response.status)
  }
})

module.exports = app.callback()
// module.exports = async (req, res) => {
//   if (req.url == "/") {
//     return send(res, 200, 'hello worldx')
//   }
//   if (req.url.endsWith('.ico')) {
//     ctx.throw(404)
//   }
//   try {
//     const buffer = await mFetchImage(req.url)
//     res.setHeader('Content-Type', 'image/jpeg')
//     res.write(buffer)
//     res.end()
//   }
//   catch(e) {
//     console.error('err', e.status, req.url)
//     return send(res, e.status)
//   }
// }
