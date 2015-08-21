// Copyright (c) 2014, 2015 Adobe Systems Incorporated. All rights reserved.
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

/* given an svgOM, generate SVG */

(function () {
    "use strict";

    var Tag = require("./svgWriterTag.js"),
        ID = require("./idGenerator.js"),
        insertArrayAt = function (array, index, arrayToInsert) {
            Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
        },
        removeChains = function (ctx, children) {
            var pass,
                name,
                i;
            for (i = 0; i < children.length - 1; i++) {
                pass = false;
                while (children[i + 1] && children[i].styleBlock && children[i + 1].styleBlock &&
                       children[i].styleBlock.isEqual(children[i + 1].styleBlock)) {
                    for (name in children[i].attrs) {
                        if (children[i].writeAttribute(name)) {
                            pass = true;
                            break;
                        }
                    }
                    if (pass) {
                        break;
                    }
                    for (name in children[i + 1].attrs) {
                        if (children[i + 1].writeAttribute(name)) {
                            pass = true;
                            break;
                        }
                    }
                    if (pass) {
                        break;
                    }
                    children[i].children = children[i].children.concat(children[i + 1].children);
                    removeChains(ctx, children[i].children);
                    children.splice(i + 1, 1);
                    if (ctx.tick) {
                        ctx.tagCounter--;
                    }
                }
            }
        },
        processFunctions = [
            function superfluousGroups(tag, ctx, parents, num) {
                var mom = parents[parents.length - 1];
                if (tag.name != "g" || tag.isArtboard || tag.children.length > 1 && !ctx.minify) {
                    return;
                }
                if (tag.children.length &&
                    !((!tag.styleBlock || !tag.styleBlock.hasRules()) &&
                    tag.getAttribute("transform") == "" &&
                    tag.getAttribute("clip-path") == "" && // Artboards set the attribute directly.
                    tag.getAttribute("id") == "")) {
                    return;
                }
                mom.children.splice(num, 1);
                if (tag.children.length) {
                    insertArrayAt(mom.children, num, tag.children);
                }
                if (ctx.tick) {
                    ctx.tagCounter--;
                }
            },
            function clipRule(tag, ctx, parents) {
                var fillRule = tag.styleBlock && tag.styleBlock.getPropertyValue("fill-rule");
                if (!fillRule) {
                    return;
                }
                var isClipPathParent;
                for (var i = 0, len = parents.length; i < len; i++) {
                    if (parents[i].name == "clipPath") {
                        isClipPathParent = true;
                        break;
                    }
                }
                if (!isClipPathParent) {
                    return;
                }
                tag.styleBlock.addRule("clip-rule", fillRule);
                tag.styleBlock.removeRule("fill-rule");
            },
            function filter4mask(tag, ctx) {
                if (tag.name == "mask" && tag.filter) {
                    tag.setAttribute("style", "");
                    if (tag.noclip) {
                        tag.setAttributes({
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0
                        });
                    }
                    if (tag.children.length == 1) {
                        tag.children[0].styleBlock.addRule("filter", "url(#" + tag.filter + ")");
                    } else {
                        var g = new Tag("g");
                        g.setStyleBlock(ctx, {});
                        g.styleBlock.addRule("filter", "url(#" + tag.filter + ")");
                        g.children = tag.children;
                        tag.children = [g];
                    }
                }
            },
            function collapseTspanClasses(tag, ctx) {
                if (tag.name != "tspan" && tag.name != "text") {
                    return;
                }
                var tagStyle = tag.styleBlock,
                    common = {},
                    name;
                for (var i = 0; i < tag.children.length; i++) {
                    var style = tag.children[i].styleBlock;
                    if (!style) {
                        return;
                    }
                    if (i) {
                        for (name in common) {
                            if (style.getPropertyValue(name) == null) {
                                delete common[name];
                            }
                        }
                    } else {
                        for (name in style.rules) {
                            common[name] = style.rules[name];
                        }
                    }
                }
                var toCollapse = [];
                for (i = 0; i < tag.children.length; i++) {
                    var child = tag.children[i];
                    style = child.styleBlock;
                    if (style) {
                        for (name in style.rules) {
                            if (common[name] == style.rules[name]) {
                                delete style.rules[name];
                            }
                        }
                        var toBe = child.styleBlock.hasRules();
                        if (!toBe) {
                            for (name in child.attrs) {
                                if (child.writeAttribute(name)) {
                                    toBe = true;
                                    break;
                                }
                            }
                        }
                        if (!toBe) {
                            toCollapse.push(child);
                        }
                    }
                }
                if (ctx.tick) {
                    ctx.tagCounter -= toCollapse.length;
                }
                for (i = 0; i < toCollapse.length; i++) {
                    tag.collapseChild(toCollapse[i]);
                }
                removeChains(ctx, tag.children);
                for (name in common) {
                    tagStyle.addRule(name, common[name]);
                }
            },
            function useTrick(tag, ctx, parents) {
                if (!tag.trick) {
                    return;
                }
                var mom = parents[parents.length - 1],
                    stroke = tag.getAttribute("stroke"),
                    fill = tag.getAttribute("fill"),
                    filter = tag.getAttribute("filter"),
                    id = tag.getAttribute("id") || ctx.ID.getUnique(tag.name),
                    list = new Tag(),
                    g = new Tag("g"),
                    use = new Tag("use", {"xlink:href": "#" + id});
                tag.setAttribute("id", id);
                list.appendChild(g, use);
                g.appendChild(tag);
                if (ctx.styling) {
                    g.setAttributes({
                        fill: fill,
                        filter: filter
                    });
                    tag.setAttributes({
                        stroke: "inherit",
                        filter: "none",
                        fill: "inherit"
                    });
                    use.setAttributes({
                        stroke: stroke,
                        fill: "none",
                        filter: "none"
                    });
                } else {
                    g.setAttribute("style", "fill: " + fill + "; filter: " + filter);
                    tag.setAttribute("style", "stroke: inherit; filter: none; fill: inherit");
                    use.setAttribute("style", "stroke: " + stroke + "; filter: none; fill: none");
                }
                tag.tricked = true;
                for (var i = 0; i < mom.children.length; i++) {
                    if (mom.children[i] == tag) {
                        mom.children.splice(i, 1, list);
                    }
                }
            }
        ];

    function process(tag, ctx, parents, num) {
        ctx.tick && ctx.tick("post");
        processFunctions.forEach(function (item) {
            item(tag, ctx, parents, num);
        });
    }

    function processStyle(ctx, blocks) {
        var id = new ID(ctx.idType);
        for (var i in blocks) {
            if (blocks[i].tags && blocks[i].tags.length && blocks[i].hasRules() && (!ctx.svgOM.global.styles || !ctx.svgOM.global.styles[blocks[i].class[0]])) {
                blocks[i].class[0] = id.getUnique("cls");
            }
        }
    }

    function postProcess(tag, ctx, parents, num) {
        var root = !parents;
        parents = parents || [];
        parents.push(tag);
        if (tag.children) {
            for (var i = tag.children.length - 1; i >= 0; i--) {
                postProcess(tag.children[i], ctx, parents.slice(0), i);
            }
        }
        parents.pop();
        process(tag, ctx, parents.slice(0), num);
        if (root) {
            ctx.omStylesheet.consolidateStyleBlocks();
            processStyle(ctx, ctx.omStylesheet.blocks);
        }
    }

    module.exports.postProcess = postProcess;
}());
