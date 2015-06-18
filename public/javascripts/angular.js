var app = angular.module('lucidNews', ['ui.router']);

app
    .factory('posts', [
        '$http',
        'auth',
        function($http, $auth){

            var service = {
                posts: []
            };

            service.getAll = function() {
                return $http.get('/posts').success(function(data){
                    angular.copy(data, service.posts);
                });
            };

            service.create = function(post) {
                return $http.post('/posts', post, {
                    headers: {Authorization: 'Bearer ' + auth.getToken()}
                }).success(function(data){
                    service.posts.push(post);
                });
            };

            service.upvote = function(post) {
                return $http.put('/posts/' + post._id + '/upvote', null, {
                    headers: {Authorization: 'Bearer ' + auth.getToken()}
                }).success(function(data){
                    post.upvotes += 1;
                });
            };

            service.get = function(id) {
                return $http.get('/posts/' + id).then(function(res){
                    return res.data;
                });
            };

            service.addComment = function(id, comment) {
                return $http.post('/posts/' + id + '/comments', comment, {
                    headers: {Authorization: 'Bearer ' + auth.getToken()}
                });
            };

            service.upvoteComment = function(post, comment) {
                return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
                    headers: {Authorization: 'Bearer ' + auth.getToken()}
                }).success(function(data){
                    comment.upvotes += 1;
                });
            };

            return service;
        }
    ])
    .factory('auth', ['$http', '$window', function($http, $window){

            var auth = {};

            auth.saveToken = function (token){
                $window.localStorage['lucid-news-token'] = token;
            };

            auth.getToken = function (){
                return $window.localStorage['lucid-news-token'];
            };

            auth.isLoggedIn = function(){
                var token = auth.getToken();

                if(token) {
                    var payload = JSON.parse($window.atob(token.split('.')[1]));
                    return payload.exp > Date.now() / 1000;
                } else {
                    return false;
                }
            };

            auth.currentUser = function(){
                if(auth.isLoggedIn()) {
                    var token = auth.getToken();
                    var payload = JSON.parse($window.atob(token.split('.')[1]));

                    return payload.username;
                }
            };

            auth.register = function(user){
                return $http.post('/register', user).success(function(data){
                    auth.saveToken(data.token);
                });
            };

            auth.logIn = function(user){
                return $http.post('/login', user).success(function(data){
                    auth.saveToken(data.token);
                });
            };

            auth.logOut = function(){
                $window.localStorage.removeItem('lucid-news-token');
            };

            return auth;
        }
    ]);

app
    .config([
        '$stateProvider',
        '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {

            $stateProvider
                .state('home', {
                    url: '/home',
                    templateUrl: '/home.html',
                    controller: 'HomeController',
                    resolve: {
                        postPromise: ['posts', function(posts){
                            return posts.getAll();
                        }]
                    }
                })
                .state('posts', {
                    url: '/posts/{id}',
                    templateUrl: '/posts.html',
                    controller: 'PostsController',
                    resolve: {
                        post: ['$stateParams', 'posts', function($stateParams, posts) {
                            return posts.get($stateParams.id);
                        }]
                    }
                })
                .state('login', {
                    url: '/login',
                    templateUrl: '/login.html',
                    controller: 'AuthController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(auth.isLoggedIn()){
                            $state.go('home');
                        }
                    }]
                })
                .state('register', {
                    url: '/register',
                    templateUrl: '/register.html',
                    controller: 'AuthController',
                    onEnter: ['$state', 'auth', function($state, auth){
                        if(auth.isLoggedIn()){
                            $state.go('home');
                        }
                    }]
                });

            $urlRouterProvider.otherwise('home');
        }
    ]);

app
    .controller('HomeController', [
        '$scope',
        'posts',
        'auth',
        function($scope, posts, auth){

            $scope.isLoggedIn = auth.isLoggedIn;
            $scope.posts = posts.posts;

            $scope.addPost = function(){
                if(!$scope.title || $scope.title === '') { return; }

                posts.create({
                    title: $scope.title,
                    link: $scope.link
                });

                $scope.title = '';
                $scope.link = '';
            };

            $scope.incrementUpvotes = function(post) {
                posts.upvote(post);
            }
        }
    ])
    .controller('PostsController', [
        '$scope',
        'posts',
        'post',
        'auth',
        function($scope, posts, post, auth){

            $scope.post = post;

            $scope.addComment = function(){
                if($scope.body === '') { return; }

                posts.addComment(post._id, {
                    body: $scope.body,
                    author: 'user'
                }).success(function(comment) {
                    $scope.post.comments.push(comment);
                });

                $scope.body = '';
            };

            $scope.incrementUpvotes = function(comment){
                posts.upvoteComment(post, comment);
            };
        }
    ])
    .controller('AuthController', [
        '$scope',
        '$state',
        'auth',
        function($scope, $state, auth){
            $scope.user = {};

            $scope.register = function(){
                auth.register($scope.user).error(function(error){
                    $scope.error = error;
                }).then(function(){
                    $state.go('home');
                });
            };

            $scope.logIn = function(){
                auth.logIn($scope.user).error(function(error){
                    $scope.error = error;
                }).then(function(){
                    $state.go('home');
                });
            };
        }
    ])
    .controller('NavController', [
        '$scope',
        'auth',
        function($scope, auth){
            $scope.isLoggedIn = auth.isLoggedIn;
            $scope.currentUser = auth.currentUser;
            $scope.logOut = auth.logOut;
        }
    ]);