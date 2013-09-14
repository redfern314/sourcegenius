if (Meteor.isClient) {
  Accounts.ui.config({
    requestPermissions: {
      github: ['user', 'repo']
    },
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
  });

  Template.newSource.events({
    'click #submit-new-source' : function(ev, page) {
      var textbox = page.find('textarea');
      var source = $(textbox).val();
      Source.insert({ 'source' : source, shared: [], author: Meteor.userId() }, function(error, result) {
        if (error) {
          alert('An unknown error occurred');
        } else {
          console.log(result);
          Session.set('viewing', result._id);
          $(textbox).val('');
        }
      });
    }
  });

  Template.sources.viewing = function() {
    return Session.get('viewing') ? true : false;
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
  });
}
