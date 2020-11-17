const gulp = require('gulp')
const webpackStream = require('webpack-stream')
const webpack = require('webpack')
const webpackConfig = require('./webpack.config')
const nodemon = require('gulp-nodemon')

gulp.task('packing', () =>
  webpackStream(webpackConfig, webpack).pipe(gulp.dest('public'))
)
gulp.task('webpack', () =>
  gulp.watch('./src/**/*.(js|html)', gulp.series('packing'))
)

gulp.task('start', () =>
  nodemon({ script: 'server.js', watch: ['server.js'] }).on('restart', () =>
    console.log('restart')
  )
)

gulp.task('default', gulp.parallel('webpack', 'start'))
