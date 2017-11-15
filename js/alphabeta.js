/*
 * Alpha: the value of the best choice so far at any choice along the path for MAX.
 * Beta: the value of the best (i.e. lowest value) so far at any choice point along the path for MIN.
 *

First call: alphabeta(node = root, depth = ∞, alpha = -∞, beta = +∞, maximizingPlayer = TRUE)

function alphabeta(node, depth, α, β, maximizingPlayer)
     if depth = 0 or node is a terminal node
         return the heuristic value of node
     if maximizingPlayer
         ab := -∞
         for each child of node
             ab := max(ab, alphabeta(child, depth–1, α, β, FALSE))
             α := max(α, ab)
             if β ≤ α
                 break (* β cut-off *)
         return ab
     else
         ab := +∞
         for each child of node
             ab := min(ab, alphabeta(child, depth–1, α, β, TRUE))
             β := min(β, ab)
             if β ≤ α
                 break (* α cut-off *)
         return ab
*/

function valueToString(x) {
	// Displays infinity as special character instead of text
	if (x == Infinity)
		return "∞";
	if (x == -Infinity)
		return "−∞";
	return x.toLocaleString("pt-br", {maximumFractionDigits: 0});
}

function alphabeta(node, alpha, beta, maximizingPlayer, order)
{


	function dashArray(indexes, children, node) {
		var i;
		for (i = children+1; i<indexes.length; i++)
			d3.selectAll("path")
			  .filter(function(d){return d.id == node.children[indexes[i]].id;})
			  	.attr("stroke-dasharray", "5, 5");
	}

	var nodeText = d3.selectAll("text").filter(function(d){return d.id == node.id;});
	var ab, children;
	var i, j, indexes = [];

	if (node.data.eval != undefined) 
		return node.data.eval;

	j = node.children.length;
	for(i = 0; i<j; i++)
		indexes.push(i);

	if (order == "rightFirst")
		indexes.reverse();

	if (maximizingPlayer) {
		ab = -Infinity;
		for (children = 0; children < j; children++) {
			ab = Math.max(ab, alphabeta(node.children[indexes[children]], alpha, beta, false, order));
			alpha = Math.max(alpha, ab);
			if (beta <= alpha) {
				d3.selectAll("path").filter(function(d){return d.id == node.children[indexes[children]].id;}).style("stroke", "#f00");
				break; // Beta cut-off
			}
		}
	} else {
		ab = Infinity;
		for (children = 0; children < j; children++) {
			ab = Math.min(ab, alphabeta(node.children[indexes[children]], alpha, beta, true, order));
			beta = Math.min(beta, ab);
			if (beta <= alpha) {
				d3.selectAll("path").filter(function(d){return d.id == node.children[indexes[children]].id}).style("stroke", "#00f");
				break; // Alpha cut-off
			}
		}

	}
	// Dashes pruned links
	dashArray(indexes, children, node);
	nodeText.text("(α="+valueToString(alpha)+" ß="+valueToString(beta)+") "+node.data.move);
	return ab;
}
/*
 function minimax(node, depth, maximizingPlayer)
     if depth = 0 or node is a terminal node
         return the heuristic value of node

     if maximizingPlayer
         bestValue := −∞
         for each child of node
             v := minimax(child, depth − 1, FALSE)
             bestValue := max(bestValue, v)
         return bestValue

     else    (* minimizing player *)
         bestValue := +∞
         for each child of node
             v := minimax(child, depth − 1, TRUE)
             bestValue := min(bestValue, v)
         return bestValue
 */
function minimax(node, maximizingPlayer)
{
	var mm;
	var nodeText = d3.selectAll("text").filter(function(d){return d.id == node.id;});
	if (node.data.eval != undefined)
		return node.data.eval;

	if (maximizingPlayer) {
		mm = -Infinity;
		for (i in node.children)
			mm = Math.max(minimax(node.children[i], false), mm);
	} else {
		mm = Infinity;
		for (i in node.children)
			mm = Math.min(minimax(node.children[i], true), mm);
	}
	nodeText.text("(MM="+valueToString(mm)+") "+node.data.move);
	return mm;
}

function randomize(node)
{
	var i;
	if (node.data.eval != undefined) {
		node.data.eval = Math.round(Math.random()*50)-25;
		return;
	}
	for (i in node.children)
		randomize(node.children[i]);
}