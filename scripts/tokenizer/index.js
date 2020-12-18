global.window = {};
global.ace = require('ace-builds');
var fs = require('fs');

var [file, language] = process.argv.slice(2);

var program = fs.readFileSync(file, 'utf8');

// Copied from code_widget/src/editor.tsx, need to stay in sync
var mode = language == "sql" ? "sql"
  : language == "datalog" ? "prolog"
  : language == "r" ? "r"
  : language == "q" ? "q"
  : "python";

if (mode == "q") {
  // Also copied from code_widget
  require("./mode-q");
} else {
  require(`ace-builds/src-min-noconflict/mode-${mode}`);
}

ace.require([`ace/mode/${mode}`], function({Mode}) {
  var tokenizer = new Mode().getTokenizer();
  var state = "start";
  var ntokens = 0;
  program.split("\n").forEach(line => {
    var {tokens, state} = tokenizer.getLineTokens(line, state);
    ntokens += tokens.length;
  });
  console.log(ntokens);
});
