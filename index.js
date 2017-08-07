const {send} = require('micro')
const axios = require('axios')
const fs = require('fs')
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

module.exports = async (req, res) => {
  if (req.url.endsWith('.ico')) {
    return send(res, 404)
  }
  try {
    const buffer = await mFetchImage(req.url)
    res.write(buffer)
    res.end()
  }
  catch(e) {
    console.error('err', e)
    return send(res, 404)
  }
}
