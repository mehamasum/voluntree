from django import forms
from .models import Interest


class InterestForm(forms.Form):
    def __init__(self, *args, **kwargs):
        self.dts = kwargs.pop('date_time_slots', '')
        self.volunteer = kwargs.pop('volunteer', '')

        super().__init__(*args, **kwargs)
        self.label_suffix = ""

        dts_ids = Interest.objects.filter(
            datetimeslot__in=self.dts,
            volunteer=self.volunteer
        ).values_list('datetimeslot', flat=True)

        print('interets ids', dts_ids)

        for d in self.dts:
            field_name = 'dts_' + str(d.id)
            self.fields[field_name] = forms.BooleanField(
                label=str(d),
                required=False,
                widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
            )
            self.initial[field_name] = True if d.id in dts_ids else False

    def save(self):
        print('clean', self.cleaned_data)
        count = 0
        for d in self.dts:
            field_name = 'dts_' + str(d.id)
            print('>', field_name, self.cleaned_data[field_name])
            if self.cleaned_data[field_name] == True:
                interest = Interest.objects.get_or_create(
                    datetimeslot=d,
                    volunteer=self.volunteer
                )
                print('added', interest)
                count += 1
            else:
                try:
                    interest = Interest.objects.get(
                        datetimeslot=d,
                        volunteer=self.volunteer
                    ).delete()
                    print('deleted', interest)
                except Interest.DoesNotExist:
                    print('nothing to delete')
        return count
