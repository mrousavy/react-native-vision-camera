module Pod
  module Downloader
    class Bazaar < Base
      def self.options
        [:revision, :tag]
      end

      def options_specific?
        !options[:revision].nil?
      end

      def checkout_options
        Dir.chdir(target_path) do
          options = {}
          options[:bzr] = url
          options[:revision] = `bzr revno`.chomp
          options
        end
      end

      private

      # @group Private Helpers
      #-----------------------------------------------------------------------#

      executable :bzr

      def download!
        if options[:tag]
          download_revision!(options[:tag])
        elsif options[:revision]
          download_revision!(options[:revision])
        else
          download_head!
        end
      end

      def download_head!
        bzr! 'branch', url, *dir_opts, target_path
      end

      def download_revision!(rev)
        bzr! 'branch', url, *dir_opts, '-r', rev, @target_path
      end

      # @return [String] The command line flags to use according to whether the
      #         target path exits.
      #
      def dir_opts
        if @target_path.exist?
          %w(--use-existing-dir)
        else
          []
        end
      end

      #-----------------------------------------------------------------------#
    end
  end
end
