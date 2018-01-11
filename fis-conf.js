var package = require("./package.json");

/**
 * 全局变量
 */
fis
  .set('project.files', [ // 处理文件类型
    '**.{css,less,html,php,js,png,jpg,gif,ico,eot,svg,ttf,woff,otf}'
  ])
  .set('project.ignore', [ // 忽略文件
    'package.json',
    'node_modules/**',

    'bower.json',
    'bower_components/**',

    'inc/**',

    '**/_*.*',
    '_output', //不使用用

    'fis-conf.js',
    'sftp-config.json'
  ])
  .set('project.ext', {
    less: 'css',
    sass: 'css'
  });

fis
  .match(/\.less$/i, {
    rExt: '.css', // from .less to .css
    parser: [fis.plugin('jdists'), fis.plugin('less')]
  }).match(/\.(js|html|php|css)$/i, {
    parser: fis.plugin('jdists')
  }).match(/([^\/\\]+\.(css|less))$/i, {
    release: 'css/$1',
    postprocessor: fis.plugin('autoprefixer')
  });


/**
 * online 上线版本
 */
fis.media('online')
  .match(/\.(js|css|html|php)$/i, {
    parser: fis.plugin('jdists', {
      trigger: 'release'
    }),
  }).match(/([^\/\\]+\.js)$/i, {
    optimizer: fis.plugin('uglify-js', {
      ascii_only: true
    })
  }).match(/([^\/\\]+\.(css|less))$/i, {
    optimizer: fis.plugin('clean-css') 
  }).match(/\.(js|css|less|png|jpg|gif|ico|eot|svg|ttf|woff|otf)$/i, { // 静态资源发布到static
    useHash: true,
    domain: 'http://www.yaaerr.com/static/' + package.name,
    deploy: fis.plugin('http-push2', {
      receiver: 'http://182.92.236.157:9010/receiver?token=szoqxouzl5rslo7byy94tpgb9',
      to: '/data/wwwroot/www.yaaerr.com/static/' + package.name,
      cacheDir: __dirname + '/.cache'
    })
  }).match('index.html', { // html发送到单独的位置
    deploy: fis.plugin('http-push2', {
      receiver: 'http://182.92.236.157:9010/receiver?token=y7lva8sk2gpmk4etsk9e8kt9',
      to: '/data/wwwroot/www.yaaerr.com/' + package.name,
    })
  });

/**
 * 本机测试版本
 */
fis.media('debug')
  .match(/\.(js|css|html|php)$/i, {
    parser: fis.plugin('jdists', {
      trigger: 'local'
    })
  });

function debugAddress() {
  var net = require('os').networkInterfaces();
  var result;
  Object.keys(net).some(function(key) {
    return net[key].some(function(item) {
      if (!item.internal && item.family === 'IPv4') {
        result = item.address;
        return true;
      }
    });
  });
  return result;
}

//----------------------------------
// @see open@0.0.4
var exec = require('child_process').exec;
var path = require('path');

/**
 * open a file or uri using the default application for the file type.
 *
 * @return {ChildProcess} - the child process object.
 * @param {string} target - the file/uri to open.
 * @param {string} appName - (optional) the application to be used to open the
 *      file (for example, "chrome", "firefox")
 * @param {function(Error)} callback - called with null on success, or
 *      an error object that contains a property 'code' with the exit
 *      code of the process.
 */

function open(target, appName, callback) {
  function escape(s) {
    return s.replace(/"/g, '\\\"');
  }

  var opener;

  if (typeof(appName) === 'function') {
    callback = appName;
    appName = null;
  }

  switch (process.platform) {
  case 'darwin':
    if (appName) {
      opener = 'open -a "' + escape(appName) + '"';
    } else {
      opener = 'open';
    }
    break;
  case 'win32':
    // if the first parameter to start is quoted, it uses that as the title
    // so we pass a blank title so we can quote the file we are opening
    if (appName) {
      opener = 'start "" "' + escape(appName) + '"';
    } else {
      opener = 'start ""';
    }
    break;
  default:
    if (appName) {
      opener = escape(appName);
    } else {
      // use Portlands xdg-open everywhere else
      opener = path.join(__dirname, '../vendor/xdg-open');
    }
    break;
  }

  return exec(opener + ' "' + escape(target) + '"', callback);
}

//-----------------------

var util = require('util');

function openUrl() {
  String(package.scripts.debug).replace(/-p\s*(\d+)\s*&&/, function(all, port) {
    setTimeout(function() {
      open('http://127.0.0.1:8088/index.html');
    });
  });
}

if (!(/-w?L/.test(process.argv)) &&
  fis.project.currentMedia() === 'debug') { // 存在监听
  fis.once('release:end', openUrl);
}