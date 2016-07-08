/* */ 
"format cjs";
/* jshint esnext: true */

// import angular from 'angular';

// import routes from '../routes';

import '../node_modules/highlight.js/styles/github.css';

import angular from 'angular';
import ngRoute from 'angular-route';
import hljs from './../../angular-highlightjs';

// Controllers
import { HomeCtrl } from './home/home-controller';

export default angular
  .module('app', [ngRoute, hljs])
  // .config(routes)
  .config(function (hljsServiceProvider) {
    hljsServiceProvider.setOptions({
      tabReplace: '  '
    });
  })
  .controller('HomeCtrl', HomeCtrl);
