File = new Meteor.Collection("files");

if (Meteor.isClient) {
  
    Meteor.startup(function() {
      Meteor.Router.add({
        '/': 'newFile',
        '/new': 'newFile',
        '/show/:id': function(id) {
          Session.set('fileID', id);
          return 'show';
        } 
      });
      setTimeout(function() {
        Meteor.Router.to(window.location.pathname)
      }, 500)
    }); 

    Template.newFile.events({
      'click #submit-new-file' : function(ev, page) {
        var textbox = page.find('textarea');
        var file = $(textbox).val();
        if (file === "") return;

        var language = hljs.highlightAuto(file).language;

        Files.insert({ 'file' : file, shared: [], author: Meteor.userId, language: language }, function(error, result) {
          if (error) {
            alert('An unknown error occurred');
          } else {
            Meteor.Router.to('/show/' + result);
          }
        });
      }
    })

  SessionAmplify = _.extend({}, Session, {
    keys: _.object(_.map(amplify.store(), function(value, key) {
      return [key, JSON.stringify(value)]
    })),
    set: function (key, value) {
      Session.set.apply(this, arguments);
      amplify.store(key, value);
    },
  });

	Handlebars.registerHelper('numberLines', function(obj) {
		result = [];
		var lineCount = 0;
		_.each(obj, function(line){
			result.push({name:line, value:lineCount});
			lineCount++;
		});
		return result;
	});

  Template.user.events({
    'click #user' : function(ev, page) {
      var loggedIn = SessionAmplify.get("loggedIn");
      if(loggedIn) {
        SessionAmplify.set("loggedIn",false);
      } else {
        Meteor.loginWithGithub({
          requestPermissions: ['user', 'public_repo']
        }, function (err) {
          if (err) {
            Session.set('errorMessage', err.reason || 'Unknown error');
          } else {
            // get the user's avatar
            HTTP.call("GET", "https://api.github.com/user?access_token="+
              Meteor.user().services.github.accessToken,
              function (error, result) {
                if (result.statusCode === 200) {
                  SessionAmplify.set("propic", result.data.avatar_url);
                  SessionAmplify.set("loggedIn",true);
                }
            });
          }
        });
      }
    }
  })

  Template.sources.events ({
		'mouseenter .line' : function (event) {
			Session.set('lineId', event.target.dataset.id);
		},
		'mouseleave .line' : function (event) {
			Session.set('lineId', null);
		}
   });

  Template.user.URL = function() {
    return SessionAmplify.get('propic');
  }

  Template.user.loggedIn = function() {
    return SessionAmplify.get("loggedIn");
  }

  Template.sources.viewing = function() {
    return Session.get('viewing') ? true : false;
  }

  Template.show.splitLines = function() {
  	var file = File.find(Session.get('fileID')).fetch()[0];
  	var lines = file.file.split("\n"),
    	resultsArray = [];
    	_.each(lines, function(line) {
    		resultsArray.push({text: line, index: resultsArray.length, language: file.language});
    	});
    	return resultsArray;
  }

  Template.sources.userSources = function() {
    return Source.find({ author: Meteor.userId() }).fetch();
  }

  Template.sources.sharedSources = function() {
    var sources = Source.find().fetch(),
      resultsArray = [];
    for (var i=0, l=sources.length; i<l; i++) {
      if (_.contains(sources[i].shared, Meteor.userId() )) {
        resultsArray.push(sources[i]);
      }
    }
    return resultsArray;
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup

    // set up the OAuth2 service
    Accounts.loginServiceConfiguration.remove({
      service: "github"
    });
    Accounts.loginServiceConfiguration.insert({
      service: "github",
      clientId: process.env.GITHUB_ID,
      secret: process.env.GITHUB_SECRET
    });
  });
}
