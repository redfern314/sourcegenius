if (Meteor.isClient) {
  Meteor.Router.add({
    '/': 'newFile',
    '/new': 'newFile',
    '/show/:id': function(id) {
      Session.set('fileID', id);
      return 'show';
    } 
  });

  Template.newFile.events({
    'click #submit-new-file' : function(ev, page) {
      var textbox = page.find('textarea');
      var file = $(textbox).val();
      File.insert({ 'file' : file, shared: [], author: Meteor.userId }, function(error, result) {
        if (error) {
          alert('An unknown error occurred');
        } else {
          console.log("going to", result);
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

  Template.user.URL = function() {
    return Session.get('propic');
  }

  Template.user.loggedIn = function() {
    return Session.get("loggedIn");
  }

  Template.sources.viewing = function() {
    return Session.get('viewing') ? true : false;
  }

  Template.show.file = function() {
    return File.find(Session.get('fileID')).fetch()[0];
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
