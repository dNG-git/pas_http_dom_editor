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
         'djs/NodePosition.min',
         'djs/Spinner.min',
         'pas/HttpJsonApiRequest.min'
       ],
function($, Hammer, NodePosition, Spinner, HttpJsonApiRequest) {
	/**
	 * The "execute()" helper function is used for JavaScript events or static
	 * link targets.
	 *
	 * @function
	 * @name _pas_HttpJsonApiDomEditor_execute
	 * @global
	 * @param {String} id DOM node ID to be activated
	 */
	function execute(id, args) {
		new HttpJsonApiDomEditor({ 'id': id }).execute(args);
	}

	/**
	 * "HttpJsonApiDomEditor" instances provide easier access to the "direct PAS"
	 * API endpoints.
	 *
	 * @class HttpJsonApiDomEditor
	 * @param {Object} args Arguments to initialize a given HttpJsonApiDomEditor
	 */
	function HttpJsonApiDomEditor(args) {
		if (args === undefined || (!('id' in args))) {
			throw new Error('Missing required arguments');
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
						$link.attr('href', 'javascript:void(0)');
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
	 * Prepares and extends the given request arguments.
	 *
	 * @method
	 * @param {Object} args Base arguments
	 * @return {Object} Prepared and extended arguments
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
	 * Prepares and extends the given request arguments.
	 *
	 * @method
	 * @param {Object} args Base arguments
	 * @return {Object} Prepared and extended arguments
	 */
	HttpJsonApiDomEditor.prototype._handle = function(response) {
		if (response.api_call == "replace_dom" && 'dom_value' in response) {
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
		} else if (response.api_call == "replace_dom_id"
		           && 'dom_id' in response
		           && 'dom_value' in response
		          ) {
			var $current_node = $("#" + response.dom_id);
			var $new_node = $(response.dom_value);

			if ($new_node.attr('id') === undefined) {
				$new_node.attr('id', response.dom_id);
			}

			$current_node.replaceWith($new_node);
		}

		this._destroy_executing_spinner();
	}

	/**
	 * Prepares and extends the given request arguments.
	 *
	 * @method
	 * @param {Object} args Base arguments
	 * @return {Object} Prepared and extended arguments
	 */
	HttpJsonApiDomEditor.prototype._handle_error = function(error_message) {
		this._destroy_executing_spinner();
		alert(error_message);
		// @TODO: NotificationBox.add_error(error_message);
	}

	/**
	 * Prepares and extends the given request arguments.
	 *
	 * @method
	 * @param {Object} args Base arguments
	 * @return {Object} Prepared and extended arguments
	 */
	HttpJsonApiDomEditor.prototype.execute = function(args) {
		var hjapi_request = new HttpJsonApiRequest({ endpoint: 'pas/dynamic/' });

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

		var hjapi_promise = hjapi_request.call({ data: args.query });
		this.executing_spinner.show();

		var _this = this;

		hjapi_promise.done(function(data, status, jQxhr) {
			if ('api_call' in data) {
				_this._handle(data);
			} else {
				_this._handle_error(status);
			}
		});

		hjapi_promise.fail(function(jQxhr, status, error) {
			if ('responseJSON' in jQxhr
			    && 'error' in jQxhr.responseJSON
			    && 'message' in jQxhr.responseJSON.error
			   ) {
				_this._handle_error(jQxhr.responseJSON.error.message);
			} else {
				_this._handle_error(error);
			}
		});
	}

	return HttpJsonApiDomEditor;
});

//j// EOF