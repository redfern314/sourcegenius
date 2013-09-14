var codeSnippet = "test1 \n test2 \n test3";
var annotations = {1:"cooodddee", 2:"fuuuunnnn,yaaayyy"};

if (Meteor.isClient) {

	var currLine = 0;
	var fileId = 1;
	var lineId = 1;

	Template.codeSnippet.linesOfCode = function () {
		return getCodeSnippetLines(fileId);
	};

	Template.codeSnippet.annotations = function() {
		if (lineId) {
			return annotations[lineId].split(",");
			//return annotations.find(lineId).fetch();
		} else {
			return [];
		}
	};

	Template.codeSnippet.nextLine = function() {
		return currLine++;
	};

	Template.codeSnippet.events ({
		'mouseenter .line' : function (event) {
			lineId = event.target.dataset.id;
		},
		'mouseleave .line' : function (event) {
			lineId = null;
		}
	});

  Accounts.ui.config({
    requestPermissions: {
      github: ['user', 'repo']
    },
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
  });

  Template.newSource.events({
    'click #submit-new-source' : function(ev, page) {
      var $textbox = page.find('textarea');
      var source = $textbox.val();
      Source.insert({ 'source' : source, shared: [], author: Meteor.userId }, function(error, result) {
        if (error) {
          alert('An unknown error occurred');
        } else {
          $textbox.val('');
        }
      });
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

function getCodeSnippetLines(fileId) {
	if (fileId) {
		//return files.find(fileId).fetch().split("\n");
		return codeSnippet.split("\n");
	} else {
		return [];
	}
};
