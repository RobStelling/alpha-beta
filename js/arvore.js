/*
 * Tree input and drawing functions, based on D3 V3 version of https://bl.ocks.org/mbostock/4339083
 * and ported to V4
 */
var margin = {top: 20, right: 100, bottom: 20, left: 160},
    width = 950 - margin.right - margin.left,
    height = 900 - margin.top - margin.bottom;

const duration = 750,
    depth = 165;

var nodeCount = 0, root, treemap = d3.tree()
    .size([height, width]);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function collapse(d) {
  // Moves .children to _children so nodes are collapsed when update is called
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}
/*
 * Recursively preserves and restores evaluation nodes
 */
function preserve(node) {
  // Saves original tree evaluation nodes
  var i;
  if (node.data.eval != undefined) {
    node.data._original = node.data.eval;
    return;
  }
  for (i in node.children)
    preserve(node.children[i]);
}

function restore(node) {
  // Restore original tree evaluation nodes (after randomization)
  var i;
  if (node.data.eval != undefined) {
    node.data.eval = node.data._original;
    return;
  }
  for (i in node.children)
    restore(node.children[i]);
}

/*
 * Reads a new tree and updates it, can be called from console to upload a new tree
 */
function startTree(file) {
  function readTree() {
    d3.selectAll("circle").remove();
    d3.selectAll("text").remove();
    d3.selectAll("path").remove();
    d3.json("./json/"+file, function(error, jogo) {
      if (error) throw error;

      root = d3.hierarchy(jogo, function(d){return d.children;});
      root.x0 = height / 2;
      root.y0 = 0;
      preserve(root); // Preserve original evaluations
      update(root);   // Draws tree
    });
  }
  if (root != undefined) {
    clearTree();
    collapse(root);
    update(root);
    setTimeout(readTree, 1500);
  } else
    readTree();
}
/*
 * Updades tree
 * Can update the tree if some of the children are collapsed
 * but this funciontality is not used in this demo
 */
function update(source) {

  var treeData = treemap(root);
  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);
  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * depth; });
  // Update the nodes…
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++nodeCount); });
  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });
      // .on("click", click);
  // Add nodes, with zero size
  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .attr("class", function(d){return d.data.eval!=undefined?"eval":(d.depth%2?"min":"max");});
      //.style("fill", function(d){return d._children ? "lightsteelblue" :"#fff"; });
  // Add labels
  nodeEnter.append("text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.data.move+(d.data.eval!=undefined?": "+d.data.eval.toLocaleString("pt-br", {maximumFractionDigits: 0}):""); })
      .style("fill-opacity", 1e-6);
  // Transition nodes to their new position.
  var nodeUpdate = nodeEnter.merge(node);
  nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
  // Udate node attributes
  nodeUpdate.select("circle")
      .attr("r", 4.5);
      //.style("fill", function(d) { return d._children ? "lightsteelblue" : d.link ? "#0f0" : d.children ? "#fff" : "#f00"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();
  // Collapss nodes
  nodeExit.select("circle")
      .attr("r", 1e-6);
  // and text
  nodeExit.select("text")
      .style("fill-opacity", 1e-6);
  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr("stroke", pathStroke)
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return curveto(o, o)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return curveto(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return curveto(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });
}
// Creates a cubic Bézier curved path from parent to child nodes
function curveto(s, d) {
  // Uses template literal to compute SVG path command
  // M: Starts a new sub-path at the given (x,y) coordinate
  // M -> moveto (x y)+
  // M source.y source.x
  // C: Draws a cubic Bézier curfe from the current point to (x,y) using (x1,y1) as the control point at the beginning
  //    of the curve and (x2 y2) as the control point at the end of the curve
  // C -> curveto (x1 y1 x2 y2 x y)+
  // C (source.y+destination.y)/2 source.x (source.y+destination.y)/2 destination.x destination.y destination.x
  var path = `M ${s.y} ${s.x} 
              C ${(s.y+d.y)/2} ${s.x},
                ${(s.y+d.y)/2} ${d.x},
                ${d.y} ${d.x}`;

  return path;
}
// Toggle children on click.
// Disabled (see ".on" and ".enter" in update)
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    if (d.link)
      window.open(d.link);
    d.children = d._children;
    d._children = null;
  }
  update(d);
}
