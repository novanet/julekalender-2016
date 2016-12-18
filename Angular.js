(function () {
    'use strict';

    angular
        .module('app', [])
        .controller('controller', controller)
        .factory('dataservice', dataservice);

    controller.$inject = ['dataservice'];
    dataservice.$inject = ['$q', '$http'];

    function controller(dataservice) {
        var vm = this;
        vm.answer = {};
        vm.error = null;
        vm.hasAnswered = false;
        vm.isBusyAnswering = false;
        vm.isBusyLoading = true;
        vm.sendAnswer = sendAnswer;   
                
        dataservice.getCalendar()
            .then(function(result){
                vm.calendar = result;
                vm.isBusyLoading = false;
                vm.todayHasImage = _.some(result, function(r){ return r.IsToday === 1;});
            });
            
        dataservice.getHighscore()
            .then(function(result){
                vm.highscore = result;
            });
        
        function sendAnswer(){
            if(!vm.answer.location && !vm.answer.country){
                vm.error = "Du må fylle ut sted eller land";
                return;
            }
            
            if(!vm.answer.user || vm.answer.user === 'Velg bruker'){
                vm.error = "Du må velge bruker";
                return;
            }                     
            
            vm.error = null;
            vm.isBusyAnswering = true;
            
            dataservice.postAnswer(vm.answer)
                .then(function(result){
                    vm.hasAnswered = true;
                })
                .finally(function(){
                    vm.isBusyAnswering = false;    
                });
        } 
    }

    function dataservice($q, $http) {
        return {
            getCalendar : _.once(getCalendar),
            getHighscore: _.once(getHighscore),
            postAnswer : postAnswer   
        }

        function getCalendar() {
            return $q(function (resolve, reject) {
                $http.get('http://geoquiz-api.azurewebsites.net/api/calendar')
                    .then(function (response) {
                        resolve(response.data);
                    });
            });
        }     
        
        function getHighscore() {
            return $q(function (resolve, reject) {
                $http.get('http://geoquiz-api.azurewebsites.net/api/answers')
                    .then(function (response) {
                        resolve(response.data);
                    });
            });
        }     
       function postAnswer(answer) {                              
            return $q(function (resolve, reject) {
                $http.post('http://geoquiz-api.azurewebsites.net/api/answers', answer)
                    .then(function (response) {
                        resolve(response.data);
                    });
            });
        }       
    }
})();