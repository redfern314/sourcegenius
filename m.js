var codeSnippet = "test1 \n test2 \n test3";
var annotations = {1:"cooodddee", 2:"fuuuunnnn,yaaayyy"};

if (Meteor.isClient) {

	Session.set('lineId', 0);

	Handlebars.registerHelper('numberLines', function(obj) {
		result = [];
		var lineCount = 0;
		_.each(obj, function(line){
			result.push({name:line, value:lineCount});
			lineCount++;
		});
		return result;
	});

	Template.codeSnippet.linesOfCode = function () {
		return getCodeSnippetLines();
	};

	Template.codeSnippet.annotations = function() {
		if (Session.get('lineId')) {
			return annotations[Session.get('lineId')].split(",");
			//return annotations.find(Session.get('lineId')).fetch();
		} else {
			return [];
		}
	};

	Template.codeSnippet.events ({
		'mouseenter .line' : function (event) {
			Session.set('lineId', event.target.dataset.id);
		},
		'mouseleave .line' : function (event) {
			Session.set('lineId', null);
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

function getCodeSnippetLines() {
	// get file id from url
	var fileId = 1;
	if (fileId) {
		//return files.find(fileId).fetch().split("\n");
		return codeSnippet.split("\n");
	} else {
		return [];
	}
};
