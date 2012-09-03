/**
 * This module implements the depth-first transitive closure algorithm of
 * Ioannidis and Ramakrishnan ("Efficient Transitive Closure Algorithms", VLDB '88).
 */

if(typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require, exports) {
  var numset = require('./numset'),
      Graph = require('./graph').Graph;

  Graph.prototype.reachability = function(nodePred) {
    var self = this;
    var visited, visited2, popped, global,
        m = [], t = [];

    function visit1(v) {
      visited = numset.add(visited, v);

      var changed;
      do {
        changed = false;

        numset.iter(self.succ[v], function(w) {
          if(numset.contains(m[v], w) || numset.contains(t[v], w))
            return;
          changed = true;

          if(!numset.contains(visited, w))
            visit1(w);

          if(numset.contains(popped, w)) {
            m[v] = numset.add(numset.addAll(m[v], m[w]), w);
            t[v] = numset.removeAll(numset.addAll(t[v], t[w]), m[v]);
          } else {
            t[v] = numset.add(t[v], w);
          }
        });
      } while(changed);

      if(numset.contains(t[v], v)) {
        if(numset.size(t[v]) === 1) {
          m[v] = numset.add(m[v], v);
          t[v] = void(0);
          global = m[v];
          visit2(v);
        } else {
          t[v] = numset.remove(t[v], v);
          m[v] = numset.add(m[v], v);
        }
      }

      popped = numset.add(popped, v);
    }

    function visit2(v) {
      visited2 = numset.add(visited2, v);

      numset.iter(self.succ[v], function(w) {
        if(numset.contains(visited2, w) || numset.size(t[w]) === 0)
          return;
        visit2(w);
      });

      m[v] = numset.copy(global);
      t[v] = void(0);
    }

    return {
      getReachable: function(src) {
        var src_id = self.nodeId(src);
        if(!numset.contains(visited, src_id))
          visit1(src_id);
        var tc = numset.addAll(m[src_id], t[src_id]);
        return numset.map(tc, function(dest_id) { return self.id2node[dest_id]; });
      },
      iterReachable: function(src, cb) {
        var src_id = self.nodeId(src);
        if(!numset.contains(visited, src_id))
          visit1(src_id);
        var tc = numset.addAll(m[src_id], t[src_id]);
        numset.iter(tc, function(dest_id) { cb(self.id2node[dest_id]); });
      },
      reaches: function(src, dest) {
        var src_id = self.nodeId(src), dest_id = nodeId(dest);
        if(!numset.contains(visited, src_id))
          visit1(src_id);
        var tc = numset.addAll(m[src_id], t[src_id]);
        return numset.some(tc, function(id) { return id === dest_id; });
      }
    };
  };
});