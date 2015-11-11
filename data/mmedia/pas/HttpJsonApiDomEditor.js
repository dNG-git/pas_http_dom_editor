//j// BOF

/*
direct PAS
Python Application Services
----------------------------------------------------------------------------
(C) direct Netware Group - All rights reserved
https://www.direct-netware.de/redirect?pas;http;dom_editor

This Source Code Form is subject to the terms of the Mozilla Public License,
v. 2.0. If a copy of the MPL was not distributed with this file, You can
obtain one at http://mozilla.org/MPL/2.0/.
----------------------------------------------------------------------------
https://www.direct-netware.de/redirect?licenses;mpl2
----------------------------------------------------------------------------
#echo(pasHttpDomEditorVersion)#
#echo(__FILEPATH__)#
*/

/**
 * @module HttpJsonApiDomEditor
 */
define([ 'jquery',
         'Hammer',
         'djt/ClientStorage.min',
         'djt/NodePosition.min',
         'djt/Spinner.min',
         'pas/HttpJsonApiRequest.min'
       ],
function($, Hammer, ClientStorage, NodePosition, Spinner, HttpJsonApiRequest) {
	/**
	 * List of response operations that can be cached client-side.
	 *
	 * @constant
	 */
	var SUPPORTED_CACHE_OPERATIONS = [ 'replace_dom', 'replace_dom_id' ];

	/**
	 * The "execute()" helper function is used for JavaScript events or static
	 * link targets.
	 *
	 * @function _pas_HttpJsonApiDomEditor_execute
	 * @global
	 *
	 * @param {string} id DOM node ID to be activated
	 */
	function execute(id, args) {
		new HttpJsonApiDomEditor({ 'id': id }).execute(args);
	}

	/**
	 * "HttpJsonApiDomEditor" instances provide easier access to the "direct PAS"
	 * API endpoints.
	 *
	 * @class HttpJsonApiDomEditor
	 *
	 * @param {object} args Arguments to initialize a given HttpJsonApiDomEditor
	 */
	function HttpJsonApiDomEditor(args) {
		if (args === undefined || (!('id' in args))) {
			throw new Error('Missing required argument');
		}

		if (!('_pas_HttpJsonApiDomEditor_execute' in self)) {
			self._pas_HttpJsonApiDomEditor_execute = execute;
		}

		this.$base_node = $("#" + args.id);
		this.executing_spinner = null;
		this.executing_spinner_node_position = null;
		this.id = args.id;

		if ('type' in args && args.type == 'link_activated') {
			var _this = this;

			this.$base_node.find('a').each(function(index) {
				var $link = $(this);

				var query_string = $link.data('pas-dom-editor-query');

				if (query_string !== undefined) {
					if ($link.attr('href') !== undefined) {
						$link.attr('href', 'javascript:');
					}

					var link_listener = new Hammer(this);

					link_listener.on('tap', function(event) {
						_this.execute({ query: query_string });
					});
				}
			});
		}
	}

	/**
	 * Stops and destroys the "executing spinner" animation.
	 *
	 * @method
	 */
	HttpJsonApiDomEditor.prototype._destroy_executing_spinner = function() {
		if (this.executing_spinner != null) {
			this.executing_spinner_node_position.destroy();
			this.executing_spinner.get_jQnode().remove();

			this.executing_spinner = null;
			this.executing_spinner_node_position = null;
		}
	}

	/**
	 * Handles the API call response.
	 *
	 * @method
	 *
	 * @param {object} response API call response
	 */
	HttpJsonApiDomEditor.prototype._handle = function(response) {
		if (response.api_call == 'replace_dom' && 'dom_value' in response) {
			var $new_node = $(response.dom_value);

			if ($new_node.attr('id') === undefined) {
				$new_node.attr('id', this.id);
			}

			// Destroy event listeners before replacing the referenced node
			if (this.executing_spinner_node_position != null) {
				this.executing_spinner_node_position.destroy();
			}

			this.$base_node.replaceWith($new_node);
			this.$base_node = $new_node;

			this._handle_response_api_call('on_replaced', response);
		} else if (response.api_call == 'replace_dom_id'
		           && 'dom_id' in response
		           && 'dom_value' in response
		          ) {
			var $current_node = $("#" + response.dom_id);
			var $new_node = $(response.dom_value);

			if ($new_node.attr('id') === undefined) {
				$new_node.attr('id', response.dom_id);
			}

			$current_node.replaceWith($new_node);

			this._handle_response_api_call('on_replaced', response);
		}

		this._destroy_executing_spinner();
	}

	/**
	 * Handles an API call error state.
	 *
	 * @method
	 *
	 * @param {string} error_message Error message returned or to be shown.
	 */
	HttpJsonApiDomEditor.prototype._handle_error = function(error_message) {
		this._destroy_executing_spinner();
		alert(error_message);
		// @TODO: NotificationBox.add_error(error_message);
	}

	/**
	 * Handles the response API callback.
	 *
	 * @method
	 *
	 * @param {string} api_call API callback definition
	 * @param {object} args Additional API callback arguments
	 */
	HttpJsonApiDomEditor.prototype._handle_response_api_call = function(api_call, args) {
		if (api_call in args) {
			api_call_data = this._parse_response_api_call(args[api_call]);

			var api_call_args = $.extend({ }, args);
			api_call_args['caller_instance'] = this;

			if (!('id' in api_call_args)) {
				api_call_args['id'] = this.id;
			}

			require([ api_call_data.module ], function(js_class) {
				if ('method' in api_call_data) {
					var js_instance = new js_class(api_call_args);
					js_instance[api_call_data.method]();
				} else {
					new js_class(api_call_args);
				}
			});
		}
	}

	/**
	 * Executes an API call.
	 *
	 * @method
	 *
	 * @param {object} args API call arguments
	 */
	HttpJsonApiDomEditor.prototype.execute = function(args) {
		if (args === undefined || (!('query' in args))) {
			throw new Error('Missing required argument');
		}

		var cache_data = null;
		var client_storage = null;

		if ('cache_id' in args && 'cache_value' in args) {
			client_storage = new ClientStorage();

			cache_data = (client_storage.is_ready() ? client_storage.get_data(args.cache_id) : null);

			if (cache_data != null
			    && (cache_data._cache_value != args.cache_value || cache_data._proto != '1')
			   ) {
				cache_data = null;
			}
		}

		if (cache_data == null) {
			var hjapi_promise = this._execute(args);

			if (client_storage != null) {
				hjapi_promise.done(function(data, status, jQxhr) {
					var cache_supported = ('api_call' in data
					                       && $.inArray(data.api_call, SUPPORTED_CACHE_OPERATIONS) > -1
					                      );

					if (cache_supported) {
						cache_data = data;
						cache_data._cache_value = args.cache_value;
						cache_data._proto = '1';

						client_storage.set_data(args.cache_id, cache_data);
					}
				});
			}
		} else {
			this._show_executing_spinner();
			this._handle(cache_data);
		}
	}

	/**
	 * Executes a non-cached API call.
	 *
	 * @method
	 *
	 * @param {object} args API call arguments
	 *
	 * @return {object} jQuery AJAX promise
	 */
	HttpJsonApiDomEditor.prototype._execute = function(args) {
		var hjapi_request = new HttpJsonApiRequest({ endpoint: 'pas/dynamic/' });

		this._show_executing_spinner();
		var _return = hjapi_request.call({ data: args.query });

		var _this = this;

		_return.done(function(data, status, jQxhr) {
			if ('api_call' in data) {
				_this._handle(data);
			} else {
				_this._handle_error(status);
			}
		});

		_return.fail(function(jQxhr, status, error) {
			if ('responseJSON' in jQxhr
			    && jQxhr.responseJSON !== undefined
			    && 'error' in jQxhr.responseJSON
			    && 'message' in jQxhr.responseJSON.error
			   ) {
				_this._handle_error(jQxhr.responseJSON.error.message);
			} else {
				_this._handle_error(error);
			}
		});

		return _return;
	}

	/**
	 * Parses the response API callback definition.
	 *
	 * @method
	 *
	 * @param {string} api_call API callback definition
	 *
	 * @return {object} Module to initialize and method (if defined) to call
	 */
	HttpJsonApiDomEditor.prototype._parse_response_api_call = function(api_call) {
		var _return = { };
		var api_call_data = api_call.split(':');

		if (api_call_data.length == 2) {
			_return['module'] = api_call_data[0];
			_return['method'] = api_call_data[1];
		} else {
			_return['module'] = api_call_data[0];
		}

		return _return;
	}

	/**
	 * Shows the "executing spinner" animation.
	 *
	 * @method
	 */
	HttpJsonApiDomEditor.prototype._show_executing_spinner = function() {
		if (this.executing_spinner == null) {
			var spinner_width = this.$base_node.width();
			var spinner_height = this.$base_node.height();
			var spinner_size = ((spinner_width < spinner_height) ? spinner_width : spinner_height);

			this.executing_spinner = new Spinner({ parent_id: this.id,
			                                       width: spinner_size,
			                                       height: spinner_size
			                                     });

			this.executing_spinner_node_position = new NodePosition({ jQat: this.$base_node,
			                                                          jQmy: this.executing_spinner.get_jQnode(),
			                                                          at_reference: 'middle center',
			                                                          my_reference: 'middle center'
			                                                        });
		}

		this.executing_spinner.show();
	}

	return HttpJsonApiDomEditor;
});

//j// EOF