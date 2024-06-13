module Xcodeproj
  class Project
    module Object
      # This class represents a Swift package reference.
      #
      class XCRemoteSwiftPackageReference < AbstractObject
        # @!group Attributes

        # @return [String] the repository url this Swift package was installed from.
        #
        attribute :repositoryURL, String

        # @return [Hash] the version requirements for this Swift package.
        #
        attribute :requirement, Hash

        # @!group AbstractObject Hooks
        #--------------------------------------#

        def ascii_plist_annotation
          " #{isa} \"#{File.basename(display_name)}\" "
        end

        # @return [String] the name of the Swift package repository.
        #
        def display_name
          return repositoryURL if repositoryURL
          super
        end
      end
    end
  end
end
