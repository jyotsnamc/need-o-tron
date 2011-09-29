$(function() {
  var number_of_extra_cols = $('#needs-table > thead > tr > th').length - 2;
  // it's horrid that this is hardcoded, I apologise.
  var search_cols = [
    null,
    null,
    null,
    null,
    null,
    null,
    {sType: 'priority'},
    null,
    null,
    {bSortable: false, sSearch: ""},
    {bSortable: false, sSearch: ""}
  ];

  var priority_parser = function(priority) {
    var priority_sort_lookup = {
      '-': 0,
      'l': 1,
      'm': 2,
      'h': 3
    }
    return priority_sort_lookup[priority.charAt(0).toLowerCase()];
  }
  $.fn.dataTableExt.oSort['priority-asc']  = function(a,b) {
    var x = priority_parser(a);
    var y = priority_parser(b);
    return ((x < y) ? -1 : ((x > y) ?  1 : 0));
  };
  $.fn.dataTableExt.oSort['priority-desc'] = function(a,b) {
    var x = priority_parser(a);
    var y = priority_parser(b);
    return ((x < y) ?  1 : ((x > y) ? -1 : 0));
  };

  $('#needs-table').dataTable({
    bJQueryUI: true,
    bPaginate: false,
    oSearch: {sSearch: ""},
    aoColumns: search_cols
  });
  // Fact-checking contacts

  var form_base_url = $('#fact_checkers_list').closest('form').attr('action'); // this is still true even for accountabilities
  var csrf_param = $('meta[name=csrf-param]').attr('content');
  var csrf_token = $('meta[name=csrf-token]').attr('content');

  var set_up_existing_item_li = function(item_node, url_generator) {
    var button = $('<span class="button">-</span>');
    button.appendTo(item_node);
    button.click(function() {
      var data = {};
      data[csrf_param] = csrf_token;
      $.ajax(url_generator(item_node), {
        data: data, dataType: 'text', type: 'DELETE', 
        success: function() { 
          item_node.remove();
        }
      });
    });
  };
  var set_up_create_item_li = function(item_create_node, create_url, form_data_generator, item_creator, url_generator) {
    var button = $('<span class="button">+</span>');
    var create_text_field_node = item_create_node.find('input');
    item_create_node.append(button);
    create_text_field_node.autocomplete({source: create_url + '/search.json'});
    var create_function = function() {
      $.post(create_url + '.json', form_data_generator(item_create_node), function(data) {
        var new_item_node = item_creator(data);
        item_create_node.before(new_item_node);
        set_up_existing_item_li(new_item_node, url_generator);
      }, 'json');
    };
    button.click(create_function);
    create_text_field_node.keypress(function(e) {
      if ( event.which == 13 ) {
         event.preventDefault();
         create_function();
       }
    });
  }

  // Fact Checkers
  var create_fact_checker_url = form_base_url + '/fact_checkers';
  var fact_checker_url_generator = function(node) {
    return create_fact_checker_url + '/' + node.find('input').val() + '.json';
  };
  var fact_checker_create_data_generator = function(node) {
    return {fact_checker: {contact: {email: node.find('input').val()}}};
  };
  var fact_checker_item_creator = function(data) {
    return $('<li class="existing">' + data.contact.email + '<input name="fact_checkers[' + data.id + ']" type="hidden" value="' + data.id + '">');
  }
  $('#fact_checkers_list li.existing').each(function() {
    set_up_existing_item_li($(this), fact_checker_url_generator);
  });
  $('#fact_checkers_list li[class!=existing]').each(function() {
    set_up_create_item_li($(this), create_fact_checker_url, 
                          fact_checker_create_data_generator, 
                          fact_checker_item_creator, fact_checker_url_generator);
  });

  // Accountabilities
  var create_accountability_url = form_base_url + '/accountabilities';
  var accountability_url_generator = function(node) {
    return create_accountability_url + '/' + node.find('input').val() + '.json';
  };
  var accountability_create_data_generator = function(node) {
    return {accountability: {department: {name: node.find('input').val()}}};
  };
  var accountability_item_creator = function(data) {
    return $('<li class="existing">' + data.department.name + '<input name="accountabilities[' + data.id + ']" type="hidden" value="' + data.id + '">');
  }
  $('#accountabilities_list li.existing').each(function() {
    set_up_existing_item_li($(this), accountability_url_generator);
  });
  $('#accountabilities_list  li[class!=existing]').each(function() {
    set_up_create_item_li($(this), create_accountability_url, 
                          accountability_create_data_generator, 
                          accountability_item_creator, accountability_url_generator);
  });
});
