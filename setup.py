# -*- coding: utf-8 -*-
##j## BOF

"""
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
setup.py
"""

def get_version():
#
	"""
Returns the version currently in development.

:return: (str) Version string
:since:  v0.1.00
	"""

	return "v0.1.00"
#

from dNG.distutils.command.build_py import BuildPy
from dNG.distutils.command.install_data import InstallData
from dNG.distutils.command.install_js_data import InstallJsData
from dNG.distutils.temporary_directory import TemporaryDirectory

from distutils.core import setup
from os import path

with TemporaryDirectory(dir = ".") as build_directory:
#
	js_copyright = "pas.http.dom_editor #echo(pasHttpDomEditorVersion)# - (C) direct Netware Group - All rights reserved"

	parameters = { "pasHttpDomEditorVersion": get_version(),
	               "js_header": css_js_copyright, "js_min_filenames": True
	             }

	InstallData.add_install_data_callback(InstallJsData.callback, [ "data" ])
	InstallData.set_build_target_path(build_directory)
	InstallData.set_build_target_parameters(parameters)

	_build_path = path.join(build_directory, "src")

	setup(name = "pas_http_dom_editor",
	      version = get_version(),
	      description = "Python Application Services",
	      long_description = """"pas_http_dom_editor" provides an easy API for client DOM tree manipulation.""",
	      author = "direct Netware Group",
	      author_email = "web@direct-netware.de",
	      license = "MPL2",
	      url = "https://www.direct-netware.de/redirect?pas;http;dom_editor",

	      package_dir = { "": _build_path },
	      packages = [ "dNG" ],

	      data_files = [ ( "docs", [ "LICENSE", "README" ]) ],

	      # Override build_py to first run builder.py over all PAS modules
	      cmdclass = { "build_py": BuildPy,
	                   "install_data": InstallData
	                 }
	)
#

##j## EOF