if (Meteor.isClient) {
  Meteor.Router.add({
    '/': 'newFile',
    '/new': 'newFile',
    '/show/:id': 'show'
  });

  // enable {{loginButtons}}
  Accounts.ui.config({
    requestPermissions: {
      github: ['user', 'repo']
    },
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
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

  Template.sources.viewing = function() {
    return Session.get('viewing') ? true : false;
  }

  Template.show.currentFile = function() {
    return File.find(id).fetch()[0];
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
