if (Meteor.isClient) {
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
          $textbox.val('');
          alert('An unknown error occurred');
        } else {
          
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
