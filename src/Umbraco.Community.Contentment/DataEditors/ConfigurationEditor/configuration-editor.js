﻿/* Copyright © 2019 Lee Kelleher.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

angular.module("umbraco").controller("Umbraco.Community.Contentment.DataEditors.ConfigurationEditor.Controller", [
    "$scope",
    "editorService",
    "localizationService",
    "overlayService",
    "Umbraco.Community.Contentment.Services.DevMode",
    function ($scope, editorService, localizationService, overlayService, devModeService) {

        // console.log("config-editor.model", $scope.model);

        var defaultConfig = {
            allowDuplicates: 0,
            items: [],
            maxItems: 0,
            disableSorting: 0,
            allowEdit: 1,
            allowRemove: 1,
            enableFilter: 0,
            orderBy: "name",
            overlaySize: "large",
            overlayView: "",
            enableDevMode: 0,
        };
        var config = angular.extend({}, defaultConfig, $scope.model.config);

        var vm = this;

        function init() {

            $scope.model.value = $scope.model.value || [];

            if (_.isArray($scope.model.value) === false) {
                $scope.model.value = [$scope.model.value];
            }

            vm.allowAdd = (config.maxItems === 0 || config.maxItems === "0") || $scope.model.value.length < config.maxItems;
            vm.allowEdit = Object.toBoolean(config.allowEdit);
            vm.allowRemove = Object.toBoolean(config.allowRemove);
            vm.sortable = Object.toBoolean(config.disableSorting) === false && (config.maxItems !== 1 && config.maxItems !== "1");

            vm.sortableOptions = {
                axis: "y",
                containment: "parent",
                cursor: "move",
                disabled: vm.sortable === false,
                opacity: 0.7,
                scroll: true,
                tolerance: "pointer",
                stop: function (e, ui) {
                    setDirty();
                }
            };

            vm.add = add;
            vm.edit = edit;
            vm.remove = remove;

            vm.propertyActions = [];

            if (Object.toBoolean(config.enableDevMode)) {
                vm.propertyActions.push({
                    labelKey: "contentment_editRawValue",
                    icon: "brackets",
                    method: function () {
                        devModeService.editValue($scope.model, validate);
                    }
                });
            }
        };

        function add() {

            var items = Object.toBoolean(config.allowDuplicates) ? config.items : _.reject(config.items, function (x) {
                return _.find($scope.model.value, function (y) { return x.type === y.type; });
            });

            var configPicker = {
                view: config.overlayView,
                size: config.items.length === 1 ? config.overlaySize : "small",
                config: {
                    mode: "select",
                    autoSelect: config.items.length === 1,
                    label: $scope.model.label,
                    items: items,
                    enableFilter: Object.toBoolean(config.enableFilter),
                    overlaySize: config.overlaySize,
                    orderBy: config.orderBy,
                },
                value: {},
                submit: function (model) {

                    $scope.model.value.push(model);

                    if ((config.maxItems !== 0 && config.maxItems !== "0") && $scope.model.value.length >= config.maxItems) {
                        vm.allowAdd = false;
                    }

                    setDirty();

                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            };

            editorService.open(configPicker);
        };

        function edit($index) {

            var value = $scope.model.value[$index];
            var editor = _.find(config.items, function (x) {
                return x.type === value.type;
            });

            var configPicker = {
                view: config.overlayView,
                size: config.overlaySize,
                config: {
                    mode: "edit",
                    editor: editor,
                    overlaySize: config.overlaySize,
                },
                value: value,
                submit: function (model) {
                    $scope.model.value[$index] = model;
                    setDirty();
                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            };

            editorService.open(configPicker);
        };

        function remove($index) {
            var keys = ["content_nestedContentDeleteItem", "general_delete", "general_cancel", "contentTypeEditor_yesDelete"];
            localizationService.localizeMany(keys).then(function (data) {
                overlayService.open({
                    title: data[1],
                    content: data[0],
                    closeButtonLabel: data[2],
                    submitButtonLabel: data[3],
                    submitButtonStyle: "danger",
                    submit: function () {

                        $scope.model.value.splice($index, 1);

                        if ((config.maxItems === 0 || config.maxItems === "0") || $scope.model.value.length < config.maxItems) {
                            vm.allowAdd = true;
                        }

                        setDirty();

                        overlayService.close();
                    },
                    close: function () {
                        overlayService.close();
                    }
                });
            });
        };

        function validate() {
            // TODO: [LK:2019-06-30] Need to remove any extra items.
            if ((config.maxItems !== 0 && config.maxItems !== "0") && $scope.model.value.length >= config.maxItems) {
                vm.allowAdd = false;
            } else {
                vm.allowAdd = true;
            }
        };

        function setDirty() {
            if ($scope.propertyForm) {
                $scope.propertyForm.$setDirty();
            }
        };

        init();
    }
]);
