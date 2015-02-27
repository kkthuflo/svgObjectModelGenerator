// Copyright (c) 2015 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, bitwise: true */
/*global define: true, require: true, describe: true, beforeEach: true, afterEach: true, it: true */

var expect = require('chai').expect,
    OMG = require("../svgOMGenerator.js"),
    svgWriter = require("../svgWriter.js"),
    sinon = require('sinon'),
    database = require('./test-database.js');
    fs = require('fs');


describe('svgWriter', function (){
    
    //report the differences in an easy-to-review format
    
    var sandbox = sinon.sandbox.create(),
        _isLastTest = false,
        _compareLogDoc = [],
        _compareLogSubtree = [],
        itmId = 0;
    
    beforeEach(function () {
    });
    
    function writeComparison (out, comparison, level) {
        var svgA,
            svgB;

        out.push('<li id="itm' + itmId + '" class="' + level);
        sep = ' ';
        if (comparison.passed) {
            out.push(sep + 'passed');
            sep = ' ';
        }
        if (comparison.repaired) {
            out.push(sep + 'repaired');
            sep = ' ';
            svgA = comparison.filename;
            svgB = comparison.compareFilename;
        } else if (!comparison.passed) {
            svgA = comparison.compareFilename;
            svgB = comparison.filename;
        } else {
            svgA = comparison.filename;
            svgB = '';
        }

        out.push('" onclick="compareSVG(\'#itm' + itmId++ + '\', \'' + svgA + '\', \'' + svgB + '\')"><div class="passfail"></div><span>');

        out.push(comparison.name + '</span></li>');
    }
    
    afterEach(function () {
        var out = [],
            templ,
            insertStr = "<!--INSERT-->",
            pos,
            header,
            footer;
        
        sandbox.restore();
        
        if (_isLastTest) {
            try {    
                templ = fs.readFileSync('./tests/report/reportTemplate.html').toString();
                pos = templ.indexOf(insertStr);
                header = templ.substring(0, pos);
                footer = templ.substring(pos + insertStr.length);

                out.push(header);

                _compareLogDoc.forEach(function (comparison) {
                    writeComparison(out, comparison, 'doc');
                });
                
                _compareLogSubtree.forEach(function (comparison) {
                    writeComparison(out, comparison, 'subtree');
                });

                out.push(footer);
                fs.writeFileSync('./test-summary.html', out.join(""), 'utf8');
            } catch (err) {
                console.warn("error making summary " + err);
            }
        }
    });
    function handleResults(compareLog, testName, exptectedOut, svgOut, pathData, pathCompare) {
        
        if (svgOut != exptectedOut) {
            if (repairMedia) {
                fs.writeFileSync(pathCompare, exptectedOut, 'utf8');
                fs.writeFileSync(pathData, svgOut, 'utf8');
            } else {
                fs.writeFileSync(pathCompare, svgOut, 'utf8');
            }
            compareLog.push({
                name: testName,
                passed: false,
                repaired: repairMedia,
                compareFilename: pathCompare,
                filename: pathData
            });
        } else {
            compareLog.push({
                name: testName,
                passed: true,
                filename: pathData
            });
        }
    }


    /**
     * Test extraction of all layers to SVG
     **/
    describe('Test extraction of all layers to SVG', function () {

        function compareResults (layerId, testName) {
            var svgOM,
                exptectedOut,
                svgWriterErrors = [],
                path = 'data/' + testName + '/' + testName + '-' + layerId;
            
            svgOM = require('./' + path + '-om.js');
            svgOut = svgWriter.printSVG(svgOM, {
                        trimToArtBounds: true,
                        preserveAspectRatio: "xMidYMid",
                        scale: 1,
                        constrainToDocBounds: true
                    }, svgWriterErrors);

            try {
                exptectedOut = fs.readFileSync('./tests/' + path + '.svg', 'utf8');
            } catch (e) {
                fs.writeFileSync('./tests/' + path + '.svg', svgOut, 'utf8');
                console.log('No reference SVG document found. New one created as ' + testName + '-' + layerId + '.svg');
                return svgOut;
            }
            
            handleResults(_compareLogDoc, testName, exptectedOut, svgOut, './tests/' + path + '.svg', './tests/data-compare/' + testName + '-' + layerId + '.svg');
            
            expect(svgOut).to.equal(exptectedOut);
            return svgOut;
        }

        function runJSONLayerToOMExtractionTest (layer, testName, skipTest) {

            if (skipTest) {
                it.skip('Extract ' + layer.id + ' from ' + testName, function () {
                    compareResults(layer.id, testName);
                });
            } else {
                it('Extract layer ' + layer.id + ' from ' + testName, function () {
                    compareResults(layer.id, testName);
                });
            }

            if (!layer.layers) {
                return;
            }

            for (var i = 0, end = layer.layers.length; i < end; ++i) {
                runJSONLayerToOMExtractionTest(layer.layers[i], testName, skipTest);
            }
        }

        function setupTesting (testName, desc, skipTest) {
            var testData = require('./data/' + testName + '-data.js');
            if (!testData.layers) {
                console.log('Warning: PSD does not have any layers.')
            }

            if (!fs.existsSync('./tests/data/' + testName)) {
                console.log("Error: Expected layer OM data for " + testName);
                return;
            }

            for (var j = 0, end = testData.layers.length; j < end; ++j) {
                runJSONLayerToOMExtractionTest(testData.layers[j],
                                               testName,
                                               skipTest);
            }
        }

        // Call all individual tests from test-database.js
        for (var i = 0, end = database.length; i < end; i++) {
            if (!database[i].layerTest) {
                continue;
            }
            setupTesting(database[i].test,
                database[i].desc,
                !!database[i].skip);
        }
    });

    /**
     * Test individual OM object extraction
     **/
    describe('Test individual OM object extraction', function (){


        function compareResultsExport (testName, aTestData) {
            var testData,
                svgOM,
                svgOut,
                exptectedOut,
                svgFilename,
                omOpt,
                scale,
                svgWriterErrors,
                i;
            
            for (i = 0; i + 2 < aTestData.length; i = i + 3) {
                
                omOpt = { layerSpec: aTestData[i] };
                testData = require("./data/" + testName + "/" + aTestData[i + 1] + "-data.js");
                svgFilename = "./tests/data/" + testName + "/" + aTestData[i + 1] + ".svg";

                scale = aTestData[i + 2];
                svgWriterErrors = [];

                svgOM = OMG.extractSVGOM(testData, omOpt);

                svgOut = svgWriter.printSVG(svgOM, {
                    trimToArtBounds: true,
                    preserveAspectRatio: "xMidYMid",
                    scale: scale,
                    constrainToDocBounds: true
                }, svgWriterErrors);

                try {
                   exptectedOut = fs.readFileSync(svgFilename, 'utf8');
                } catch(er) {
                    fs.writeFileSync(svgFilename, svgOut, 'utf8');
                    console.log('No reference SVG document found. New one created as ' + aTestData[i + 1] + '.svg');
                    continue;
                }

                handleResults(_compareLogSubtree, testName + "/" + aTestData[i + 1], exptectedOut, svgOut, './tests/data/' + testName + '/' + aTestData[i + 1] + '.svg', './tests/data-compare/' + testName + "-" + aTestData[i + 1] + '.svg');

                expect(svgOut).to.equal(exptectedOut);
            }
            return svgOut;
        }
        
        it("should align text properly inside a paragraph", function () {
            compareResultsExport("paragraphTextAlign", [
                26, "Group 1", 1.0,
                20, "Group 2", 1.0,
                24, "Group 3", 1.0
            ]);
        });

        it("should resolve bounds and fxBounds to properly clip layers with effects", function () {
            compareResultsExport("shapes-with-external-fx", [
                4, "outer-glow", 1.0,
                3, "drop-shadow", 1.0,
                2, "stroke", 1.0
            ]);
        });

        it("should transform text", function () {
            compareResultsExport("text-with-transform", [
                17, "flip-vertical", 1.0,
                16, "flip-horizontal", 1.0,
                34, "hard-block-left", 1.0,
                34, "hard-block-centered", 1.0,
                14, "skew-right-bottom", 1.0
            ]);
        });

        it("should transform simple shapes", function () {
            compareResultsExport("shapes-with-transform", [
                144, "rect-infer-transform", 1.0,
                150, "ellipse-infer-transform", 1.0,
                151, "ellipse-preserve-shape", 1.0
            ]);
        });
    });


    /**
     * Test complete OM to SVG extraction
     **/ 
    describe("Test complete OM to SVG extraction", function () {
        function compareResults (testName) {
            var svgOM,
                exptectedOut;
            
            svgOM = require("./data/" + testName + "-om.js");
            svgOut = svgWriter.printSVG(svgOM);

            try {
                exptectedOut = fs.readFileSync('./tests/data/' + testName + '.svg', 'utf8');
            } catch (e) {
                fs.writeFileSync('./tests/data/' + testName + '.svg', svgOut, 'utf8');
                console.log('No reference SVG document found. New one created as ' + testName + '.svg');
                return svgOut;
            }
            
            handleResults(_compareLogDoc, testName, exptectedOut, svgOut, './tests/data/' + testName + '.svg', './tests/data-compare/' + testName + '.svg');
            
            expect(svgOut).to.equal(exptectedOut);
            return svgOut;
        }

        function runCompleteOMToSVGExtractionTest(name, desc, skipTest, isLastTest) {
            if (skipTest) {
                it.skip("Entire OM ⇒ SVG for " + name, function () {
                    compareResults(name);
                    if (isLastTest) {
                        _isLastTest = true;  
                    }
                });
            } else {
                it("Entire OM ⇒ SVG for " + name, function () {
                    compareResults(name);
                    if (isLastTest) {
                        _isLastTest = true;  
                    }
                });
            }
        }

        // Call all individual tests from test-database.js
        for (var i = 0, end = database.length; i < end; i++) {
            runCompleteOMToSVGExtractionTest(database[i].test,
                database[i].desc,
                !!database[i].skip,
                i == end - 1);
        }

    });
});
