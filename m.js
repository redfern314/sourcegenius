var codeSnippet = "test1 \n test2 \n test3";
var annotations = {1:"cooodddee", 2:"fuuuunnnn,yaaayyy"};

if (Meteor.isClient) {

	var fileId = 1;
	var lineId = 2;

	Template.codeSnippet.linesOfCode = function () {
		return getCodeSnippet(fileId).split("\n");
	};

	Template.codeSnippet.annotations = function() {
		if (lineId) {
			//return annotations.find(lineNum).fetch();
			return annotations[lineId].split(",");
		} else {
			return [];
		}
	};

	Template.codeSnippet.events ({
		'mouseenter' : function (event) {
			lineId = 1;
			// figure out line number
		},
		'mouseleave' : function (event) {
			lineId = null;
		}
	});
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

function getCodeSnippet(fileId) {
	if (fileId) {
		//return files.find(fileId).fetch();
		return codeSnippet;
	} else {
		return "";
	}
};
