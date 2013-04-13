'use strict';

/* Controllers */

angular.module('cube_diff.controllers', []);

function CubeContentsCtrl($scope, CardContentService, CubeDiffService,
                          CardHeuristicService, DefaultsService,
                          NamesFromTextService, $cacheFactory) {

    $scope.spec = JSON.stringify(DefaultsService.spec(), null, 2);

    CardHeuristicService.getHeuristics(function(data) {
        $scope.heuristics = data
    });

    $scope.diffCache = $cacheFactory('diffCache', {});

    var hasChangedSinceDiff = function(toCheck) {
        var wasChanged = false;
        jQuery.each(toCheck, function(name, value) {
            var cachedValue = $scope.diffCache.get(name);
            if (!cachedValue || cachedValue!==value) {
                $scope.diffCache.put(name, value);
                wasChanged = true;
            }
        });
        return wasChanged;
    };

    $scope.beforeTextArea = DefaultsService.beforeNames();
    $scope.afterTextArea = DefaultsService.afterNames();

    var getCheckedHeuristics = function() {
        var checkedHeuristics = [];
        jQuery.each($scope.heuristics || [], function(idx, heuristic) {
            if (heuristic['checked']) {
                checkedHeuristics.push(heuristic['key']);
            }
        });
        return checkedHeuristics;
    };

    $scope.setDataAndPerform = function (data, insertJob) {
        $scope.before = CardContentService.getCachedCards(
            NamesFromTextService.getNames($scope.beforeTextArea)
        );
        $scope.after = CardContentService.getCachedCards(
            NamesFromTextService.getNames($scope.afterTextArea)
        );

        if (data) {
            $scope.invalid = data['invalid'];
        }

        if (insertJob) {
            CardContentService.consumeInserts(
                insertJob,
                $scope.setDataAndPerform,
                $scope.setDataAndPerform
            );
        }
        $scope.performDiff();
    };

    $scope.performDiff = function() {
        $scope.diffCache.put('pane', 0);
        jQuery.each($scope.diffedCube || {}, function(index, pane) {
            if (pane.active) {
                $scope.diffCache.put('pane', index);
            }
        });

        $scope.diffedCube = CubeDiffService.getDiff(
            $scope.before,
            $scope.after,
            JSON.parse($scope.spec),
            undefined,
            false,
            getCheckedHeuristics()
        );

        if (hasChangedSinceDiff({spec: $scope.spec})) {
            $scope.diffedCube[0].active = true;
        } else {
            $scope.diffedCube[$scope.diffCache.get('pane')].active = true;
        }
    };



    $scope.diff = function() {
        var names = {
            before: $scope.beforeTextArea,
            after: $scope.afterTextArea
        };

        if (hasChangedSinceDiff(names)) {
            CardContentService.cacheAllCards(
                NamesFromTextService.getNames($scope.beforeTextArea).concat(
                    NamesFromTextService.getNames($scope.afterTextArea)
                ),
            $scope.setDataAndPerform);
        } else {
            $scope.performDiff()
        }
    };
}
