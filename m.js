if (Meteor.isClient) {
  Accounts.ui.config({
    requestPermissions: {
      github: ['user', 'repo']
    },
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
  });

  Template.newFile.events({
    'click #submit-new-file' : function(ev, page) {
      var $textbox = page.find('textarea');
      var file = $textbox.val();
      File.insert({ 'file' : file, shared: [], author: Meteor.userId }, function(error, result) {
        if (error) {
          alert('An unknown error occurred');
        } else {
          $textbox.val('');
        }
      });
    }
  })

  Meteor.Router.add({
    '/': 'newFile',
    '/new': 'newFile',
    '/show/:id': function(id) {
      Session.set('fileID', id);
      return 'show'
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });



}
