# The CocoaPods check command.

# The CocoaPods namespace
module Pod
  class Command
    class Check < Command
      self.summary = <<-SUMMARY
          Displays which Pods would be changed by running `pod install`
      SUMMARY

      self.description = <<-DESC
          Compares the Pod lockfile with the manifest lockfile and shows
          any differences. In non-verbose mode, '~' indicates an existing Pod
          will be updated to the version specified in Podfile.lock and '+'
          indicates a missing Pod will be installed.
      DESC

      self.arguments = []

      def self.options
        [
          ['--verbose', 'Show change details.'],
          ['--ignore-dev-pods', 'Ignores updates to development pods.']
        ].concat(super)
      end

      def initialize(argv)
        @check_command_verbose = argv.flag?('verbose')
        @check_command_ignore_dev_pods = argv.flag?('ignore-dev-pods')
        super
      end

      def run
        unless config.lockfile
          raise Informative, 'Missing Podfile.lock!'
        end

        development_pods = find_development_pods(config.podfile)
        results = find_differences(config, development_pods)
        has_same_manifests = check_manifests(config)
        print_results(results, has_same_manifests)
      end

      def check_manifests(config)
        # Bail if the first time
        return true unless config.sandbox.manifest

        root_lockfile = config.lockfile.defined_in_file
        pods_manifest = config.sandbox.manifest_path

        File.read(root_lockfile) == File.read(pods_manifest)
      end

      def find_development_pods(podfile)
        development_pods = {}
        podfile.dependencies.each do |dependency|
          if dependency.local?
            development_pods[dependency.name] = dependency.external_source.clone
            development_pods[dependency.name][:path] = File.absolute_path(development_pods[dependency.name][:path])
          end
        end
        development_pods
      end

      def find_differences(config, development_pods)
        all_pod_names = config.lockfile.pod_names
        all_pod_names.concat development_pods.keys

        all_pod_names.sort.uniq.map do |spec_name|
          locked_version = config.lockfile.version(spec_name)

          # If no manifest, assume Pod hasn't been installed
          if config.sandbox.manifest
            manifest_version = config.sandbox.manifest.version(spec_name)
          else
            manifest_version = nil
          end

          # If this Pod is installed
          if manifest_version
            # If this is a development pod do a modified time check
            if development_pods[spec_name] != nil
              next if @check_command_ignore_dev_pods
              newer_files = get_files_newer_than_lockfile_for_podspec(config, development_pods[spec_name])
              if newer_files.any?
                changed_development_result(spec_name, newer_files)
              end
            # Otherwise just compare versions
            elsif locked_version != manifest_version
              changed_result(spec_name, manifest_version, locked_version)
            end

          # If this Pod is not installed
          else
            added_result(spec_name)
          end
        end.compact
      end

      def get_files_newer_than_lockfile_for_podspec(config, development_pod)
        files_for_podspec = get_files_for_podspec(development_pod[:path])

        lockfile_mtime = File.mtime(config.lockfile.defined_in_file)
        podspec_file = get_podspec_for_file_or_path(development_pod[:path])
        podspec_dir = Pathname.new(File.dirname(podspec_file))
        files_for_podspec
            .select {|f| File.mtime(f) >= lockfile_mtime}
            .map {|f| Pathname.new(f).relative_path_from(podspec_dir).to_s}
      end

      # Returns an array of all files pointed to by the podspec
      def get_files_for_podspec(podspec_file)
        podspec_file = get_podspec_for_file_or_path(podspec_file)

        development_pod_dir = File.dirname(podspec_file)
        spec = Specification.from_file(podspec_file)

        # Gather all the dependencies used by the spec, across all platforms, and including subspecs.
        all_files = [spec, spec.subspecs].flatten.map { |a_spec|
          a_spec.available_platforms.map { |platform|
            accessor = Sandbox::FileAccessor.new(Sandbox::PathList.new(Pathname.new(development_pod_dir)), a_spec.consumer(platform))
            [
                accessor.vendored_frameworks,
                accessor.vendored_libraries,
                accessor.resource_bundle_files,
                accessor.license,
                accessor.prefix_header,
                accessor.preserve_paths,
                accessor.readme,
                accessor.resources,
                accessor.source_files
            ].compact
          }
        }.flatten

        # Include the podspec files as well
        all_files.push(podspec_file)
      end

      def get_podspec_for_file_or_path(podspec_file_or_path)
        if File.basename(podspec_file_or_path).include?('.podspec')
          podspec_file_or_path
        else
          glob_pattern = podspec_file_or_path + '/*.podspec{,.json}'
          Pathname.glob(glob_pattern).first
        end
      end

      def changed_result(spec_name, manifest_version, locked_version)
        if @check_command_verbose
          "#{spec_name} #{manifest_version} -> #{locked_version}"
        else
          "~#{spec_name}"
        end
      end

      def changed_development_result(spec_name, newer_files)
        if @check_command_verbose
           number_files_not_shown = newer_files.length - 2
           newer_files = newer_files[0..1]
           if number_files_not_shown > 0
             newer_files.push("and #{number_files_not_shown} other#{'s' if number_files_not_shown > 1}")
           end
          "#{spec_name} (#{newer_files.join(', ')})"
        else
          "~#{spec_name}"
        end
      end

      def added_result(spec_name)
        if @check_command_verbose
          "#{spec_name} newly added"
        else
          "+#{spec_name}"
        end
      end

      def print_results(results, same_manifests)
        return UI.puts "The Podfile's dependencies are satisfied" if results.empty? && same_manifests

        unless same_manifests
          raise Informative, 'The Podfile.lock does not match the Pods/Manifest.lock.'
        end

        if @check_command_verbose
          UI.puts results.join("\n")
        else
          UI.puts results.join(', ')
        end

        raise Informative, "`pod install` will install #{results.length} Pod#{'s' if results.length > 1}."
      end
    end
  end
end
