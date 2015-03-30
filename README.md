# SVG Object Model Generator  [![Build Status](https://travis-ci.org/adobe-research/svgObjectModelGenerator.png?branch=master)](https://travis-ci.org/adobe-research/svgObjectModelGenerator)


An OMG generator and SVG writer. OMG is a JSON based vector graphics format used as intermediate format for transformation to different output formats.

## Overview

svgObjectModelGenerator consists of two parts

1. **svgOM to generate OMG from Generator JSON**

	This part of the library is Photoshop specific and requires the [Generator](https://github.com/adobe-photoshop/generator-core) module to be active and running in Photoshop. svgOM itself is a Node.js module that takes Generator JSONs as input and transforms it to OMG.

	svgOM can just be used with Generator JSON.

2. **svgWriter to generate SVG from OMG**

	svgWriter is another Node.js based module that takes OMG as input and transforms it to highly optimized yet easy to read and script SVG.

	svgWriter is application-independent and can be used in other environments than Photoshop as well.

## License
All code is offered under the [Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).


## Development and Contributions

We :clap: pull requests! If you submit one, please also sign our [Contributor License Agreement](https://adobe.echosign.com/public/esignWidget?wid=9SNA9H6XX64Q5C).

Every pull request must be reviewed by at least one contributor. A patch gets merged on a positive review.

The project follows the default code conventions of the ESLint project. Dependent on the used code editor there may be extensions for automatic checking:

* **Sublime Text 2/3** Use [SublimeLinter](https://github.com/roadhump/SublimeLinter-eslint) in a combination with a [ESLint](https://github.com/roadhump/SublimeLinter-eslint).
* **Brackets** Use the extension [brackets-eslint](https://github.com/peol/brackets-eslint).

## Running svgWriter

To run *svgWriter* as a Node.js module separately from svgOM do the following.

In `package.json` replace the line

```javascript
"main": "main.js",
```

with

```javascript
"main": "svgWriter.js",
```

**svgWriter** takes multiple arguments to pass over OMG as well as parametrization for svgWriter.

First include svgWriter

```javascript
svgWriter = require("./svgWriter.js");
```

then call svgWriter

```javascript
svgWriter.printSVG(OMG, config, errors)
```

* **OMG** The parsed JSON object.
* **config** The configuration of *svgWriter*.
* **errors** An array with string items. Each item a error report.

The configuration object has the following arguments:

* **trimToArtBounds** *boolean* The SVG will cover the art bounds independent of the dimension of the OMG document.
* **constrainToDocBounds** *boolean*
* **preserveAspectRatio** *string* Aspect ratio as defined by the [SVG specification](http://www.w3.org/TR/SVG/coords.html#PreserveAspectRatioAttribute).
* **scale** *number* A scale factor.
* **targetWidth** *number* The width the SVG document needs to fit into.
* **targetHeight** *number* The height the SVG document needs to fit into.
* **cropRect** *object* A rectangle with the properties `x`, `y`, `width` and `height`. `x` and `y` are optional. Defines a rectangle the SVG document gets cropped to. It may create a padding if the dimension is smaller than the crop rectangle.
* **minify** Avoids indentations, newlines and whitespaces in the SVG output. Uses minimal IDs.

## Setup Generator

The generator plugin adds Copy Generator DOM to make it easy to get test data for the svgOMGenerator

    cd generator/plugins/  
    ln -s /path/to/svgObjectModelGenerator svgObjectModelGenerator

## Running the tests

The tests rely on mocha and chai, so make sure you have run `npm install` in your repository. Then, to run the tests, all you have to do is run `npm test`.

## Debugging the tests

The tests can be debugged using `npm run-script test-debug`

## Code Coverage 

Generate the code coverage report "svgomg-code-coverage.html" by running `npm run-script cover`

## Getting more test data

The test data comes from processing PSDs using the generator plugin defined in main.js.  With the plugin running and your PSD open in Photoshop use File > Generate > Copy Generator DOM.  This copies the generator JSON to your clipboard.

Now, create a file with the PSD's name adding "-data.js" to the end, so "file.psd" becomes "file-data.js"  Inside the file define the data so it can be loaded using require

    module.exports = DATA;
    
Please don't check binary PSD files into this repo.
