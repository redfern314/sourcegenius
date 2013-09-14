Files = new Meteor.Collection("files");

if (Meteor.isClient) {
  
    Meteor.startup(function() {
      Meteor.Router.add({
        '/': 'newFile',
        '/new': 'newFile',
        '/show/:id': function(id) {
          Session.set('file',Files.find(id).fetch()[0]);
          return 'show';
        } 
      });
      setTimeout(function() {
        Meteor.Router.to(window.location.pathname)
      }, 500)
    })    
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

    Template.newFile.events({
      'click #submit-new-file' : function(ev, page) {
        var textbox = page.find('textarea');
        var file = $(textbox).val();
        Files.insert({ 'file' : file, shared: [], author: Meteor.userId }, function(error, result) {
          if (error) {
            alert('An unknown error occurred');
          } else {
            Meteor.Router.to('/show/' + result);
          }
        });
      }
    })

    Template.user.events({
      'click #user' : function(ev, page) {
        var loggedIn = Session.get("loggedIn");
        if(loggedIn) {
          Session.set("loggedIn",false);
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
                    Session.set("propic", result.data.avatar_url);
                    Session.set("loggedIn",true);
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
      return Session.get('propic');
    }

    Template.user.loggedIn = function() {
      return Session.get("loggedIn");
    }

    Template.sources.viewing = function() {
      return Session.get('viewing') ? true : false;
    }

    Template.show.splitLines = function() {
      var file = Session.get('file'),
    	  lines = file.file.split("\n");

    	resultsArray = [];
    	_.each(lines, function(line) {
    		resultsArray.push({text: line, index: resultsArray.length});
    	});
    	return resultsArray;
    }

    Template.show.rendered = function() {
      Prism.highlightAll();
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
