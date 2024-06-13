module Xcodeproj
  class Project
    module Object
      # This class represents a Swift package product dependency.
      #
      class XCSwiftPackageProductDependency < AbstractObject
        # @!group Attributes

        # @return [XCRemoteSwiftPackageReference] the Swift package reference.
        #
        has_one :package, XCRemoteSwiftPackageReference

        # @return [String] the product name of this Swift package.
        #
        attribute :product_name, String

        # @!group AbstractObject Hooks
        #--------------------------------------#

        # @return [String] the name of the Swift package.
        #
        def display_name
          return product_name if product_name
          super
        end
      end
    end
  end
end
