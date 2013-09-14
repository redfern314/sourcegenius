File = new Meteor.Collection("files");
Annotations = new Meteor.Collection('annotations');

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

        File.insert({ 'file' : file, shared: [], author: Meteor.userId, language: language }, function(error, result) {
          if (error) {
            alert('An unknown error occurred');
          } else {
            Meteor.Router.to('/show/' + result);
          }
        });
      }
    });

    $(document).click(function() {
      console.log("removing");
      $(".annotations").slideUp(200);
      Session.set('annotations', false);
    });

    Template.annotations.events({
      'click *' : function(ev) {
        ev.stopPropagation();
      }
    });

    Template.show.events({
      'click .line' : function(ev) {
        $(".annotations").slideDown(200);
        $target = $(ev.target);
        while ( !$target.hasClass('line') ) {
          $target= $($target.parent());
        }
        var lineId = $target.data('id');
        Session.set('lineAnnotationNumber', lineId);
        ev.stopPropagation();
      },
      'keydown #annotation' : function(ev) {
        var keyCode = ev.keyCode || ev.which;
        if ( keyCode == 13 ) {
          Annotations.insert({ 
            author: Meteor.user(), 
            file: Session.get('fileID'),
            line: Session.get('lineAnnotationNumber'),
            text: $("#annotation").val()
          }, function(error, result) {
            if (error) {
              alert("An unknown error has occurred");
            } else {
              console.log("SUCCESS INSERTING ANNOTATION", result); 
              $("#annotation").val('');
              ev.preventDefault();
              ev.stopPropagation();
            }
          });
        }
      }
    });

    Template.annotations.annos = function() {
      return Annotations.find({
                'line': Session.get('lineAnnotationNumber'), 
                'file': Session.get('fileID')
              }).fetch();
    }

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
                  Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.propic":result.data.avatar_url}})
                }
            });
          }
        });
      }
    }
  })


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
  	var lines = File.find(Session.get('fileID')).fetch()[0].file.split("\n"),
    	resultsArray = [];
    	_.each(lines, function(line) {
    		resultsArray.push({text: line, index: resultsArray.length, language: file.language});
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

    Meteor.users.allow({
      update: function (userId, user, fields, modifier) {
        // can only change your own documents
        if(user._id === userId)
        {
          Meteor.users.update({_id: userId}, modifier);
          return true;
        }
        else return false;
      }
    });

  });
}
